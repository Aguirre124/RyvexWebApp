import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Button from '../../../../components/Button'
import Input from '../../../../components/Input'
import { isValidEmail, isValidPhone } from '../../../../utils/validators'

const fallbackSchema = z.object({
  type: z.enum(['email', 'phone']),
  value: z.string().min(1, 'Este campo es requerido')
}).refine((data) => {
  if (data.type === 'email') return isValidEmail(data.value)
  if (data.type === 'phone') return isValidPhone(data.value)
  return false
}, {
  message: 'Formato inválido',
  path: ['value']
})

type FallbackForm = z.infer<typeof fallbackSchema>

type FallbackInviteFormProps = {
  onAddInvite: (data: { email?: string; phone?: string }) => void
}

export default function FallbackInviteForm({ onAddInvite }: FallbackInviteFormProps) {
  const [inviteType, setInviteType] = useState<'email' | 'phone'>('email')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FallbackForm>({
    resolver: zodResolver(fallbackSchema),
    defaultValues: {
      type: inviteType,
      value: ''
    }
  })

  const onSubmit = (data: FallbackForm) => {
    if (data.type === 'email') {
      onAddInvite({ email: data.value })
    } else {
      onAddInvite({ phone: data.value })
    }
    reset()
  }

  return (
    <div className="mt-4 p-4 bg-[#071422] border border-[#1f2937] rounded-lg">
      <h4 className="text-sm font-semibold text-white mb-3">
        ¿No encuentras al jugador? Invítalo directamente
      </h4>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setInviteType('email')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            inviteType === 'email'
              ? 'bg-primary text-black'
              : 'bg-[#0b1220] text-gray-400 border border-[#1f2937]'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setInviteType('phone')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            inviteType === 'phone'
              ? 'bg-primary text-black'
              : 'bg-[#0b1220] text-gray-400 border border-[#1f2937]'
          }`}
        >
          Teléfono
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input type="hidden" {...register('type')} value={inviteType} />
        
        <div>
          <Input
            {...register('value')}
            type={inviteType === 'email' ? 'email' : 'tel'}
            placeholder={inviteType === 'email' ? 'jugador@email.com' : '+57 300 123 4567'}
          />
          {errors.value && (
            <div className="text-red-400 text-xs mt-1">{errors.value.message}</div>
          )}
        </div>

        <Button type="submit" variant="secondary" className="!py-2">
          + Agregar invitación
        </Button>
      </form>
    </div>
  )
}
