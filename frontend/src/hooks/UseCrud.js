import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

export function useCrud(fetchFn, params = {}) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(params);
      setData(res.data.results ?? res.data);
    } catch (e) {
      setError(e);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load, setData };
}

export function useModal(initial = null) {
  const [state, setState] = useState({ open: false, data: initial });
  const open  = (data = null) => setState({ open: true, data });
  const close = ()            => setState({ open: false, data: null });
  return { ...state, open, close };
}

export function useConfirm() {
  const [state, setState] = useState({ open: false, id: null, extra: null });
  const ask   = (id, extra = null) => setState({ open: true, id, extra });
  const close = ()                  => setState({ open: false, id: null, extra: null });
  return { ...state, ask, close };
}