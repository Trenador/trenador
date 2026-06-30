import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <img src="/assets/trenador-logo-mark.svg" alt="Trenador" className="mb-8 h-10 w-auto opacity-80" />
      <p className="label-mono mb-3 text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/chat"
        className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  )
}
