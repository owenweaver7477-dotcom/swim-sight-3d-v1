export function getConsentActionState({ record, unavailable = false } = {}) {
  const knownMinor = record?.is_minor === true;
  const status = record?.consent_status || 'none';

  if (unavailable) {
    return {
      canUpload: false,
      canStartAI: false,
      status: 'unavailable',
      message: 'Consent records are currently unavailable. Upload and AI review for minors should remain disabled until the consent migration is confirmed.',
    };
  }

  if (knownMinor && status !== 'granted') {
    return {
      canUpload: false,
      canStartAI: false,
      status: status === 'withdrawn' ? 'withdrawn' : 'required',
      message: status === 'withdrawn'
        ? 'Consent has been withdrawn. Do not upload or process new footage for this swimmer.'
        : 'Guardian consent must be recorded before uploading or processing footage for this swimmer.',
    };
  }

  return {
    canUpload: true,
    canStartAI: true,
    status: knownMinor ? 'granted' : 'not_required',
    message: knownMinor
      ? 'Guardian consent is recorded for this swimmer.'
      : 'No minor consent block is recorded for this swimmer.',
  };
}
