import { Wrapper } from "./wrapper"

export function Footer() {
  return (
    <Wrapper>
      <footer className="text-center text-foreground/30 text-xs [&_a]:underline [&_a]:decoration-foreground/15 [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:hover:text-foreground/50 [&_a]:hover:decoration-foreground/30">
        Built by{" "}
        <a href="https://truthixify.vercel.app" target="_blank" rel="noopener">
          truthixify
        </a>
      </footer>
    </Wrapper>
  )
}
