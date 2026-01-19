import React from 'react'
import Button from '../../components/Button'

type TermsModalProps = {
  onClose: () => void
}

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a1628] border border-[#1f2937] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#1f2937]">
          <h2 className="text-2xl font-bold text-white">Términos y Condiciones</h2>
        </div>
        
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-gray-300">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">TÉRMINOS Y CONDICIONES GENERALES DE USO</h3>
            <p className="text-primary font-semibold mb-2">Plataforma TEAMS SPORTS</p>
            <p className="text-gray-400 text-xs mb-4">Última actualización: 19 / 01 / 2026</p>
            <p className="mb-4">
              Al acceder, registrarse o utilizar la plataforma TEAMS SPORTS (en adelante, la "Plataforma"), el usuario declara que ha leído, entendido y aceptado los presentes Términos y Condiciones de Uso, así como la Autorización para el Tratamiento de Datos Personales aquí descrita.
            </p>
            <p className="mb-4 text-yellow-400 font-semibold">
              Si no está de acuerdo con estos términos, debe abstenerse de utilizar la Plataforma.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">1. Objeto de la Plataforma</h4>
            <p>
              RYVEX es una plataforma digital destinada a la creación, gestión y organización de partidos y competencias deportivas amateur, permitiendo a los usuarios crear equipos, organizar partidos amistosos, invitar jugadores y gestionar información relacionada con actividades deportivas.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">2. Usuarios</h4>
            <p>
              Podrán ser usuarios de la Plataforma las personas naturales mayores de edad que se registren y proporcionen información veraz, completa y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">3. Uso permitido</h4>
            <p className="mb-2">El usuario se compromete a:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Utilizar la Plataforma únicamente para fines lícitos y deportivos.</li>
              <li>No suplantar la identidad de terceros.</li>
              <li>No proporcionar información falsa o engañosa.</li>
              <li>No usar la Plataforma para actividades fraudulentas, ofensivas o contrarias a la ley.</li>
            </ul>
            <p className="mt-2">
              RYVEX se reserva el derecho de suspender o cancelar cuentas que incumplan estos términos.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">4. Creación de equipos y partidos</h4>
            <p className="mb-2">El usuario podrá:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Crear equipos deportivos.</li>
              <li>Organizar partidos amistosos.</li>
              <li>Invitar a otros jugadores mediante enlaces, correo electrónico o número telefónico.</li>
              <li>Gestionar información relacionada con los partidos creados.</li>
            </ul>
            <p className="mt-2">
              RYVEX no garantiza la asistencia, comportamiento o desempeño de los participantes en los partidos.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">5. Responsabilidad</h4>
            <p className="mb-2">
              RYVEX actúa únicamente como una herramienta tecnológica de intermediación y no asume responsabilidad por:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Lesiones, daños o accidentes ocurridos durante los partidos.</li>
              <li>Incumplimientos entre jugadores o equipos.</li>
              <li>Cancelaciones, retrasos o conflictos entre usuarios.</li>
            </ul>
            <p className="mt-2 font-semibold">
              El uso de la Plataforma se realiza bajo responsabilidad exclusiva del usuario.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">6. Propiedad intelectual</h4>
            <p>
              Todos los elementos de la Plataforma (marca, diseño, código, logotipos, textos) son propiedad de RYVEX o de sus licenciantes. Queda prohibida su reproducción sin autorización expresa.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">7. Modificaciones</h4>
            <p>
              RYVEX podrá modificar estos Términos y Condiciones en cualquier momento. Las modificaciones serán informadas dentro de la Plataforma y el uso continuo implicará su aceptación.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">8. Legislación aplicable</h4>
            <p>
              Estos términos se rigen por las leyes del país donde opere RYVEX. Cualquier controversia será sometida a las autoridades competentes.
            </p>
          </div>

          <div className="pt-4 border-t border-[#1f2937]">
            <h3 className="text-lg font-bold text-white mb-4">AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES</h3>
            <p className="mb-4">
              En cumplimiento de la normativa vigente sobre protección de datos personales, el usuario autoriza de manera libre, previa, expresa e informada a RYVEX para recolectar, almacenar, usar y tratar sus datos personales conforme a las siguientes condiciones:
            </p>

            <h4 className="font-bold text-white mb-2">1. Datos personales recolectados</h4>
            <p className="mb-2">RYVEX podrá recolectar y tratar, entre otros, los siguientes datos:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Nombre y apellido</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Información de equipos y partidos creados</li>
              <li>Datos de uso dentro de la Plataforma</li>
            </ul>

            <h4 className="font-bold text-white mb-2">2. Finalidades del tratamiento</h4>
            <p className="mb-2">Los datos personales serán utilizados para:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Crear y administrar la cuenta del usuario.</li>
              <li>Permitir la creación y gestión de equipos y partidos.</li>
              <li>Enviar invitaciones, notificaciones y comunicaciones relacionadas con la actividad deportiva.</li>
              <li>Almacenar el historial de partidos, equipos y estadísticas generadas en la Plataforma.</li>
              <li>Mejorar la experiencia de usuario y el funcionamiento de la Plataforma.</li>
              <li>Cumplir obligaciones legales y contractuales.</li>
            </ul>

            <h4 className="font-bold text-white mb-2">3. Almacenamiento de información</h4>
            <p className="mb-2">
              El usuario autoriza expresamente a RYVEX para almacenar los datos y la información generada dentro de la aplicación, incluyendo:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Equipos creados</li>
              <li>Partidos organizados</li>
              <li>Invitaciones enviadas y aceptadas</li>
              <li>Resultados y eventos asociados a los partidos</li>
            </ul>
            <p className="mb-4">
              Estos datos podrán conservarse mientras la cuenta esté activa o durante el tiempo necesario para cumplir las finalidades descritas.
            </p>

            <h4 className="font-bold text-white mb-2">4. Derechos del titular</h4>
            <p className="mb-2">El usuario podrá en cualquier momento:</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Conocer, actualizar y rectificar sus datos personales.</li>
              <li>Solicitar la eliminación de sus datos, cuando sea legalmente procedente.</li>
              <li>Revocar la autorización otorgada.</li>
              <li>Presentar consultas o reclamos relacionados con el tratamiento de sus datos.</li>
            </ul>
            <p className="mb-4">
              Las solicitudes podrán realizarse a través de los canales de contacto definidos por RYVEX.
            </p>

            <h4 className="font-bold text-white mb-2">5. Seguridad de la información</h4>
            <p className="mb-4">
              RYVEX implementará medidas técnicas y organizativas razonables para proteger los datos personales contra acceso no autorizado, pérdida o uso indebido. No obstante, el usuario reconoce que ningún sistema es completamente seguro.
            </p>

            <h4 className="font-bold text-white mb-2">6. Aceptación</h4>
            <p className="mb-2">Al registrarse y utilizar la Plataforma, el usuario acepta expresamente:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Los Términos y Condiciones de Uso.</li>
              <li>La Autorización para el Tratamiento y Almacenamiento de sus Datos Personales.</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-[#1f2937]">
          <Button onClick={onClose} variant="primary" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
