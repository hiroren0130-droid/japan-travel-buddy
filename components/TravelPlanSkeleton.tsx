"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function TravelPlanSkeleton() {
  const travelPlanSkeletonMessages =
    useLocale().messages.travelPlanSkeleton;
  const generationSteps = [
    {
      icon: "📍",
      label: travelPlanSkeletonMessages.steps[0].label,
      description: travelPlanSkeletonMessages.steps[0].description,
    },
    {
      icon: "🏯",
      label: travelPlanSkeletonMessages.steps[1].label,
      description: travelPlanSkeletonMessages.steps[1].description,
    },
    {
      icon: "🚃",
      label: travelPlanSkeletonMessages.steps[2].label,
      description: travelPlanSkeletonMessages.steps[2].description,
    },
    {
      icon: "✨",
      label: travelPlanSkeletonMessages.steps[3].label,
      description: travelPlanSkeletonMessages.steps[3].description,
    },
  ];

  return (
    <div
      className="
        overflow-hidden
        rounded-3xl
        border
        border-blue-100
        bg-white
        shadow-sm
      "
      role="status"
      aria-live="polite"
      aria-label={travelPlanSkeletonMessages.ariaLabel}
    >
      {/* Loading status */}
      <div
        className="
          relative
          overflow-hidden
          border-b
          border-blue-100
          bg-gradient-to-br
          from-blue-50
          via-white
          to-cyan-50
          px-5
          py-8
          sm:px-8
          sm:py-10
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-16
            h-48
            w-48
            rounded-full
            bg-blue-100/60
            blur-3xl
          "
          aria-hidden="true"
        />

        <div
          className="
            absolute
            -bottom-20
            -left-16
            h-48
            w-48
            rounded-full
            bg-cyan-100/60
            blur-3xl
          "
          aria-hidden="true"
        />

        <div className="relative">
          <div
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-start gap-4">
              <div
                className="
                  relative
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-600
                  text-2xl
                  text-white
                  shadow-lg
                  shadow-blue-200
                "
                aria-hidden="true"
              >
                <span className="animate-pulse">
                  ✈️
                </span>

                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    h-4
                    w-4
                    animate-ping
                    rounded-full
                    bg-cyan-400
                    opacity-75
                  "
                />

                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    h-4
                    w-4
                    rounded-full
                    border-2
                    border-white
                    bg-cyan-400
                  "
                />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-blue-600
                  "
                >
                  {travelPlanSkeletonMessages.badge}
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-bold
                    tracking-tight
                    text-gray-900
                    sm:text-2xl
                  "
                >
                  {travelPlanSkeletonMessages.title}
                </h2>

                <p
                  className="
                    mt-2
                    max-w-2xl
                    text-sm
                    leading-6
                    text-gray-600
                  "
                >
                  {travelPlanSkeletonMessages.description}
                </p>
              </div>
            </div>

            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-blue-100
                bg-white/80
                px-4
                py-2
                text-sm
                font-medium
                text-blue-700
                shadow-sm
                backdrop-blur
              "
            >
              <span
                className="
                  h-2
                  w-2
                  animate-pulse
                  rounded-full
                  bg-blue-500
                "
                aria-hidden="true"
              />

              {travelPlanSkeletonMessages.preparingLabel}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-7">
            <div
              className="
                h-2
                overflow-hidden
                rounded-full
                bg-blue-100
              "
              aria-hidden="true"
            >
              <div
                className="
                  h-full
                  w-2/3
                  animate-pulse
                  rounded-full
                  bg-gradient-to-r
                  from-blue-500
                  via-cyan-400
                  to-blue-500
                "
              />
            </div>

            <p
              className="
                mt-3
                text-xs
                leading-5
                text-gray-500
              "
            >
              {travelPlanSkeletonMessages.waitMessage}
            </p>
          </div>

          {/* Generation steps */}
          <div
            className="
              mt-7
              grid
              gap-3
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {generationSteps.map((step, index) => (
              <div
                key={step.label}
                className="
                  rounded-2xl
                  border
                  border-white/80
                  bg-white/75
                  p-4
                  shadow-sm
                  backdrop-blur
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-lg
                    "
                    aria-hidden="true"
                  >
                    {step.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="
                          flex
                          h-5
                          w-5
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-600
                          text-[10px]
                          font-bold
                          text-white
                        "
                      >
                        {index + 1}
                      </span>

                      <p
                        className="
                          text-sm
                          font-semibold
                          text-gray-900
                        "
                      >
                        {step.label}
                      </p>
                    </div>

                    <p
                      className="
                        mt-1.5
                        text-xs
                        leading-5
                        text-gray-500
                      "
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview skeleton */}
      <div
        className="
          animate-pulse
          bg-gradient-to-b
          from-white
          to-gray-50/60
        "
        aria-hidden="true"
      >
        {/* Header */}
        <div className="border-b border-gray-100 p-6 sm:p-8">
          <div className="h-7 w-2/3 rounded-lg bg-blue-100" />

          <div className="mt-4 h-4 w-1/2 rounded bg-gray-200" />
        </div>

        {/* Summary */}
        <div className="border-b border-gray-100 p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100" />

            <div className="h-5 w-36 rounded bg-gray-200" />
          </div>

          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-10 p-6 sm:p-8">
          {[1, 2].map((day) => (
            <div key={day}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100" />

                <div className="h-7 w-32 rounded-lg bg-gray-200" />
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="
                      rounded-2xl
                      border
                      border-gray-200
                      bg-white
                      p-5
                      sm:p-6
                    "
                  >
                    <div
                      className="
                        flex
                        flex-col
                        gap-4
                        sm:flex-row
                        sm:items-start
                      "
                    >
                      <div
                        className="
                          h-24
                          w-full
                          shrink-0
                          rounded-xl
                          bg-gray-200
                          sm:h-28
                          sm:w-36
                        "
                      />

                      <div className="flex-1">
                        <div className="h-4 w-20 rounded bg-blue-100" />

                        <div className="mt-3 h-6 w-48 max-w-full rounded bg-gray-200" />

                        <div className="mt-4 h-4 w-full rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />

                        <div className="mt-5 flex gap-3">
                          <div className="h-8 w-24 rounded-full bg-gray-200" />
                          <div className="h-8 w-28 rounded-full bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
