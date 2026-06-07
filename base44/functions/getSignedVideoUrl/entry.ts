import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Auth — must be logged in
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { video_upload_id } = body;

    if (!video_upload_id) {
      return Response.json({ error: 'video_upload_id is required' }, { status: 400 });
    }

    // 2. Fetch the VideoUpload record (service role so we can always read it)
    const upload = await base44.asServiceRole.entities.VideoUpload.get(video_upload_id);
    if (!upload) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    if (!upload.file_uri) {
      return Response.json({ error: 'Video has no private file attached' }, { status: 400 });
    }

    // 3. Verify the requesting user is a member of the club that owns this video
    const memberships = await base44.asServiceRole.entities.ClubMember.filter({ user_id: user.id });
    const clubIds = memberships.map(m => m.club_id);
    if (upload.club_id && !clubIds.includes(upload.club_id)) {
      return Response.json({ error: 'Forbidden: not a member of this club' }, { status: 403 });
    }

    // 4. Generate a 1-hour signed URL — use the URI from the record, never from the caller
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: upload.file_uri,
      expires_in: 3600,
    });

    return Response.json({ signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});