"use client";

type Step = { label: string; short: string };

export function FormProgress({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />
      </div>

      <ol className="relative flex justify-between">
        {steps.map((step, idx) => {
          const num = idx + 1;
          const done = num < currentStep;
          const active = num === currentStep;

          return (
            <li key={step.label} className="flex flex-col items-center">
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  done
                    ? "border-blue-600 bg-blue-600 text-white"
                    : active
                      ? "border-blue-600 bg-white text-blue-600 shadow-md shadow-blue-100"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {done ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`mt-2 hidden text-xs font-medium sm:block ${
                  active
                    ? "text-blue-600"
                    : done
                      ? "text-gray-600"
                      : "text-gray-400"
                }`}
              >
                {step.short}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
