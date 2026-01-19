import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Divider from '../../components/Divider'
import TermsModal from './TermsModal'
import { useAuthStore } from './auth.store'
import logo from '../../assets/logo.png'

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
  const [showTerms, setShowTerms] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="w-36 h-36 mb-2 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/40 via-transparent to-transparent shadow-lg overflow-hidden">
            <img src={logo} alt="Team Sports Logo" className="w-32 h-32 rounded-full object-cover" />
          </div>
          <div className="text-2xl font-extrabold">TEAMS SPORTS</div>
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
            {errors.email && (
              <div className="text-red-400 text-xs px-1">{errors.email.message === 'Required' ? 'El correo electrónico es obligatorio' : 'Ingresa un correo electrónico válido'}</div>
            )}
            <Input label="Contraseña" type="password" {...register('password')} />
            {errors.password && (
              <div className="text-red-400 text-xs px-1">{errors.password.message === 'Required' ? 'La contraseña es obligatoria' : 'La contraseña debe tener al menos 4 caracteres'}</div>
            )}
            
            {mode === 'register' && (
              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-600 bg-[#0b1220] text-primary focus:ring-primary focus:ring-offset-0"
                />
                <label htmlFor="terms" className="text-xs text-gray-400">
                  Acepto los términos y condiciones de uso de TEAMS SPORTS
                </label>
              </div>
            )}
            
            <Button 
              type="submit"
              disabled={mode === 'register' && !acceptedTerms}
            >
              {loading ? (mode === 'login' ? 'Entrando...' : 'Registrando...') : mode === 'login' ? 'Entrar' : 'Registrarse'}
            </Button>
          </form>
          <div className="text-xs text-muted text-center">
            {mode === 'login' ? (
              <>
                ¿Nuevo en RYVEX?{' '}
                <button className="text-primary underline" type="button" onClick={() => { setMode('register'); setAcceptedTerms(false); reset() }}>Regístrate</button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button className="text-primary underline" type="button" onClick={() => { setMode('login'); setAcceptedTerms(false); reset() }}>Inicia sesión</button>
              </>
            )}
          </div>
        </div>

        {mode === 'register' && (
          <div className="text-xs text-gray-400 mt-4 text-center">
            Conoce nuestros{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-primary underline hover:text-primary/80"
            >
              Términos y Condiciones
            </button>
            {' '}de TEAMS SPORTS
          </div>
        )}
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  )
}
