import { useEffect } from 'react';

export default function usePublicMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Swim Sight 3D` : 'Swim Sight 3D';

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }
  }, [title, description]);
}
