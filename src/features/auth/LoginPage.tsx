import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Divider from '../../components/Divider'
import { useAuthStore } from './auth.store'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
})
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4)
})
type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail)
  const registerUser = useAuthStore((s) => s.register)
  const loading = useAuthStore((s) => s.loading)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginForm | RegisterForm>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema)
  })

  const onSubmit = async (data: any) => {
    setError(null)
    try {
      if (mode === 'login') {
        await loginWithEmail(data.email, data.password)
      } else {
        await registerUser(data.name, data.email, data.password)
      }
      navigate('/home')
    } catch (e: any) {
      setError(e.message || 'An error occurred')
    }
  }

  const handleGoogle = () => {
    import('./auth.service').then(({ authService }) => {
      authService.startGoogleSignIn()
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold">RYVEX</div>
          <div className="text-sm text-muted">Organiza competiciones amateur</div>
        </div>

        <div className="card space-y-4">
          {error && (
            <div className="bg-red-900 text-red-200 text-sm rounded p-2 text-center">
              {error}
            </div>
          )}
          <Button onClick={handleGoogle} variant="primary">Continuar con Google</Button>

          <Divider label={mode === 'login' ? 'o usa tu correo' : 'o regístrate con correo'} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {mode === 'register' && (
              <Input label="Nombre" type="text" {...register('name')} />
            )}
            <Input label="Correo electrónico" type="email" {...register('email')} />
            <Input label="Contraseña" type="password" {...register('password')} />
            <Button type="submit">{loading ? (mode === 'login' ? 'Entrando...' : 'Registrando...') : mode === 'login' ? 'Entrar' : 'Registrarse'}</Button>
          </form>
          <div className="text-xs text-muted text-center">
            {mode === 'login' ? (
              <>
                ¿Nuevo en RYVEX?{' '}
                <button className="text-primary underline" type="button" onClick={() => { setMode('register'); reset() }}>Regístrate</button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button className="text-primary underline" type="button" onClick={() => { setMode('login'); reset() }}>Inicia sesión</button>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-muted mt-4 text-center">Al continuar aceptas los términos de servicio de RYVEX</div>
      </div>
    </div>
  )
}
