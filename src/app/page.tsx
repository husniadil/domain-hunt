import Image from 'next/image';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center space-y-8 text-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-8 items-center sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
              Domain Hunt
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Find and hunt for the perfect domain names for your next project
            </p>
          </div>

          {/* Theme showcase cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
            <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">🌅 Light Theme</h3>
              <p className="text-sm text-muted-foreground">
                Clean and bright interface for daytime usage with optimal
                contrast and readability.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">🌙 Dark Theme</h3>
              <p className="text-sm text-muted-foreground">
                Eye-friendly dark mode for comfortable nighttime browsing and
                reduced eye strain.
              </p>
            </div>
          </div>

          <div className="bg-muted text-muted-foreground p-4 rounded-lg border border-border w-full max-w-2xl">
            <p className="text-sm text-center">
              <strong>✨ Theme Toggle:</strong> Try the theme switcher in the
              header! Choose between Light, Dark, or System preference to see
              the theme switcher in action.
            </p>
          </div>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <a
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={20}
                height={20}
              />
              Deploy now
            </a>
            <a
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read our docs
            </a>
          </div>

          <footer className="flex gap-6 flex-wrap items-center justify-center pt-8 border-t border-border">
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              Learn
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Examples
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
              />
              Go to nextjs.org →
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}
