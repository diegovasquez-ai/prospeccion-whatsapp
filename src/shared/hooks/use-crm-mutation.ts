import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/stores/toast-store'

interface Options<TData, TVars> {
  successMessage?: string | ((data: TData, vars: TVars) => string)
}

/**
 * Mutación que, al terminar, refresca todos los datos del CRM
 * (las tablas están relacionadas) y muestra un aviso de éxito o error.
 */
export function useCrmMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { successMessage }: Options<TData, TVars> = {}
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (data, vars) => {
      if (successMessage)
        toast.success(typeof successMessage === 'function' ? successMessage(data, vars) : successMessage)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Ocurrió un error'),
    onSettled: () => queryClient.invalidateQueries(),
  })
}
