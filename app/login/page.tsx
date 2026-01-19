import { login } from './actions'

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <form className="flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-semibold tracking-tight">DūArte</h1>
                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <input id="email" name="email" type="email" required className="rounded-md border px-3 py-2 text-sm" />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <input id="password" name="password" type="password" required className="rounded-md border px-3 py-2 text-sm" />
                </div>
                <button formAction={login} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
                    Sign In
                </button>
            </form>
        </div>
    )
}
