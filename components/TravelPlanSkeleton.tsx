export default function TravelPlanSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Header */}
      <div className="bg-blue-100 p-6">
        <div className="h-8 w-2/3 rounded bg-blue-200" />

        <div className="mt-3 h-4 w-1/2 rounded bg-blue-200" />
      </div>

      {/* Summary */}
      <div className="space-y-3 border-b p-6">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>

      {/* Timeline */}
      <div className="space-y-8 p-6">

        {[1, 2, 3].map((day) => (
          <div key={day}>
            <div className="mb-5 h-8 w-32 rounded bg-gray-200" />

            <div className="space-y-4">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="h-5 w-24 rounded bg-gray-200" />

                  <div className="mt-3 h-6 w-48 rounded bg-gray-200" />

                  <div className="mt-4 h-4 w-full rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
                </div>
              ))}

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}