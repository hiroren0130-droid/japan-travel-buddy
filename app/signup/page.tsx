export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Create Account
        </h1>

        <form className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Name
            </label>

            <input
              type="text"
              placeholder="Your name"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Your email"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
            Create Account
          </button>
        </form>
      </div>
    </main>
  );
}