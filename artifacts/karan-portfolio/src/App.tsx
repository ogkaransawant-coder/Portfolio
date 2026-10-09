import { type CSSProperties, useEffect, useRef, useState } from 'react';

const sections = ['home', 'about', 'education', 'skills', 'experience', 'contact'] as const;
type SectionId = (typeof sections)[number];
type IntroPhase = 'loading' | 'closing' | 'entered';

function LetterLine({ children }: { children: string }) {
  return (
    <>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {Array.from(children).map((letter, index) => (
          <span className="heading-char" style={{ '--char-delay': `${index * 40}ms` } as CSSProperties} key={`${letter}-${index}`}>
            {letter === ' ' ? '\u00a0' : letter}
          </span>
        ))}
      </span>
    </>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <header className="section-header reveal" data-delay="100">
      <span>{label}</span>
      <time dateTime="2026-05-09">MAY 09, 2026</time>
    </header>
  );
}

function SectionFooter({ school = true, social = true }: { school?: boolean; social?: boolean }) {
  return (
    <footer className="section-footer reveal" data-delay="600">
      <a href="mailto:og.karansawant@gmail.com" data-testid="link-email-footer">og.karansawant@gmail.com</a>
      {social && <span>@KaranSawant16</span>}
      {school && <span>Viva College of Science Arts and Commerce</span>}
    </footer>
  );
}

function IntroLoader({ closing, onSkip }: { closing: boolean; onSkip: () => void }) {
  return (
    <div className={`page-loader${closing ? ' is-closing' : ''}`} aria-live="polite">
      <div className="page-loader__header" aria-hidden="true">
        <span>KARAN SAWANT</span>
        <span>PORTFOLIO / 2026</span>
      </div>
      <div className="loader-center">
        <span className="loader-mark" aria-hidden="true"><span>KS</span></span>
        <p className="loader-title" role="status">Opening portfolio</p>
        <div className="loading-track" aria-hidden="true"><span /></div>
        <button className="skip-intro" type="button" onClick={onSkip}>Skip intro</button>
      </div>
      <div className="page-loader__footer" aria-hidden="true">
        <span>DATA SCIENCE · FRONTEND</span>
        <span>01 / 06</span>
      </div>
    </div>
  );
}

function App() {
  const [introPhase, setIntroPhase] = useState<IntroPhase>(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'entered' : 'loading',
  );
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const introPhaseRef = useRef<IntroPhase>(introPhase);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (introPhase !== 'loading') return;

    let cancelled = false;
    const pause = (duration: number) =>
      new Promise<void>((resolve) => window.setTimeout(resolve, duration));
    const hero = document.querySelector<HTMLImageElement>('.hero-portrait');
    const imageReady = hero ? hero.decode().catch(() => undefined) : Promise.resolve();
    const fontReady = document.fonts?.ready ?? Promise.resolve();
    const mediaReady = Promise.race([
      Promise.all([imageReady, fontReady]).then(() => undefined),
      pause(1600),
    ]);

    Promise.all([pause(1050), mediaReady]).then(() => {
      if (!cancelled) {
        setIntroPhase((current) => current === 'loading' ? 'closing' : current);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [introPhase]);

  useEffect(() => {
    if (introPhase !== 'closing') return;
    const timer = window.setTimeout(() => setIntroPhase('entered'), 720);
    return () => window.clearTimeout(timer);
  }, [introPhase]);

  useEffect(() => {
    introPhaseRef.current = introPhase;
    if (introPhase === 'entered') {
      document.documentElement.classList.remove('intro-active');
      requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>('.stage').forEach((stage) => {
          const rect = stage.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight * 0.92) {
            stage.classList.add('is-visible');
          }
        });
      });
    } else {
      document.documentElement.classList.add('intro-active');
    }
  }, [introPhase]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll<HTMLElement>('[data-delay]').forEach((element) => {
      element.style.setProperty('--delay', `${element.dataset.delay ?? 0}ms`);
    });
    document.documentElement.classList.add('motion-ready');
    const stageNodes = Array.from(document.querySelectorAll<HTMLElement>('.stage'));
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (introPhaseRef.current !== 'entered') return;
        if (entry.isIntersecting) {
          requestAnimationFrame(() => entry.target.classList.add('is-visible'));
        } else if (entry.boundingClientRect.bottom <= 0 || entry.boundingClientRect.top >= window.innerHeight) {
          entry.target.classList.remove('is-visible');
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });
    stageNodes.forEach((stage) => revealObserver.observe(stage));

    let scrollFrame = 0;
    const updateActive = () => {
      scrollFrame = 0;
      const center = window.innerHeight * 0.48;
      let nearest: SectionId = 'home';
      let distance = Number.POSITIVE_INFINITY;
      stageNodes.forEach((stage) => {
        const rect = stage.getBoundingClientRect();
        const candidateDistance = Math.abs((rect.top + Math.min(rect.height, window.innerHeight) / 2) - center);
        if (rect.bottom > 0 && rect.top < window.innerHeight && candidateDistance < distance) {
          distance = candidateDistance;
          nearest = stage.id as SectionId;
        }
      });
      setActiveSection(nearest);
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateActive);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateActive();

    const cursor = cursorRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    const canUseCursor = !reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrame = 0;
    let cursorVisible = false;
    const drawCursor = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      const transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      if (ring) ring.style.transform = transform;
      if (glow) glow.style.transform = transform;
      if (cursorVisible && (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1)) {
        animationFrame = requestAnimationFrame(drawCursor);
      } else animationFrame = 0;
    };
    const hideCursor = () => {
      cursorVisible = false;
      cursor?.classList.remove('is-active', 'is-link');
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!canUseCursor || event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!cursorVisible) {
        currentX = targetX;
        currentY = targetY;
        cursorVisible = true;
        cursor?.classList.add('is-active');
      }
      cursor?.classList.toggle('is-link', Boolean((event.target as HTMLElement).closest('a, button')));
      document.documentElement.style.setProperty('--drift-x', `${(event.clientX / window.innerWidth - 0.5) * -10}px`);
      document.documentElement.style.setProperty('--drift-y', `${(event.clientY / window.innerHeight - 0.5) * -8}px`);
      if (!animationFrame) animationFrame = requestAnimationFrame(drawCursor);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', hideCursor);
    window.addEventListener('blur', hideCursor);

    return () => {
      document.documentElement.classList.remove('motion-ready');
      revealObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', hideCursor);
      window.removeEventListener('blur', hideCursor);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      {introPhase !== 'entered' && (
        <IntroLoader
          closing={introPhase === 'closing'}
          onSkip={() => setIntroPhase((current) => current === 'loading' ? 'closing' : current)}
        />
      )}
      <a className="skip-link" href="#about" data-testid="link-skip-content">Skip to content</a>
      <main aria-hidden={introPhase !== 'entered'} inert={introPhase !== 'entered'}>
        <section id="home" className={`stage hero${introPhase === 'entered' ? ' is-visible' : ''}`} aria-labelledby="home-title">
          <nav className="top-nav" aria-label="Portfolio sections">
            {sections.map((id) => (
              <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'true' : undefined} data-testid={`link-nav-${id}`}>
                {{ home: 'Home', about: 'About', education: 'Education', skills: 'Skills', experience: 'Work', contact: 'Contact' }[id]}
              </a>
            ))}
          </nav>
          <SectionHeader label="DATA SCIENTIST & FRONTEND ENGINEER" />
          <h1 id="home-title" className="hero-title reveal">
            <LetterLine>PORTFOLIO</LetterLine>
          </h1>
          <img className="portrait hero-portrait reveal" data-motion="rise" src="/assets/portrait-1.png" alt="Karan Sawant wearing a black suit" fetchPriority="high" />
          <p className="hero-intro reveal" data-delay="250">Final-year Data Science student building practical AI models, machine learning pipelines, and user-centric web applications.</p>
          <SectionFooter />
        </section>

        <section id="about" className="stage about" aria-labelledby="about-title">
          <SectionHeader label="CREATIVE PORTFOLIO" />
          <div className="about-copy">
            <h2 id="about-title" className="display-title">
              <span className="reveal"><LetterLine>HELLO, I’M</LetterLine></span>
              <span className="reveal" data-delay="120"><LetterLine>KARAN</LetterLine></span>
              <span className="reveal" data-delay="240"><LetterLine>SAWANT</LetterLine></span>
            </h2>
            <ul className="about-list reveal" data-delay="360">
              <li>A Professional Web Developer</li>
              <li>A Founder of Hack Nets</li>
              <li>A Specialized Entrepreneur and a UI/UX Developer</li>
              <li>Master in Graphic Designing</li>
            </ul>
          </div>
          <div className="circle about-circle reveal" data-motion="right" aria-hidden="true" />
          <img className="portrait about-portrait reveal" data-motion="right" src="/assets/portrait-2.png" alt="Karan seated in black clothing" loading="lazy" />
          <SectionFooter />
        </section>

        <section id="education" className="stage education" aria-labelledby="education-title">
          <SectionHeader label="CREATIVE PORTFOLIO" />
          <div className="circle education-circle reveal" data-motion="left" aria-hidden="true" />
          <img className="portrait education-portrait reveal" data-motion="left" src="/assets/portrait-3.png" alt="Karan in a black jacket" loading="lazy" />
          <div className="education-copy">
            <h2 id="education-title" className="display-title">
              <span className="reveal"><LetterLine>MY</LetterLine></span>
              <span className="reveal" data-delay="120"><LetterLine>EDUCATION</LetterLine></span>
            </h2>
            <div className="education-items">
              <article className="education-item reveal" data-delay="200">
                <div className="item-heading"><h3>NGV Vartak English High School</h3><span>(2008 – 2022)</span></div>
                <p>A high school graduate interested in technology and science.</p>
              </article>
              <article className="education-item reveal" data-delay="320">
                <div className="item-heading"><h3>Viva College of Science Arts and Commerce</h3><span>(2024 – 2027)</span></div>
                <p>A BSc Data Science student and an artistic person interested in making connections.</p>
              </article>
            </div>
          </div>
          <SectionFooter social={false} />
        </section>

        <section id="skills" className="stage skills" aria-labelledby="skills-title">
          <SectionHeader label="CREATIVE PORTFOLIO" />
          <div className="skills-copy">
            <h2 id="skills-title" className="display-title">
              <span className="reveal"><LetterLine>PERSONAL</LetterLine></span>
              <span className="reveal" data-delay="120"><LetterLine>SKILLS</LetterLine></span>
            </h2>
            <div className="skill-items">
              <article className="reveal" data-delay="240"><h3>Photography</h3><p>A passionate nature, beauty and wildlife photographer.</p></article>
              <article className="reveal" data-delay="360"><h3>Videography</h3><p>Bringing non-living scenes to life through wildlife, fantasy and nature’s beauty.</p></article>
            </div>
          </div>
          <div className="circle skills-circle reveal" data-motion="right" aria-hidden="true" />
          <img className="portrait skills-portrait reveal" data-motion="right" src="/assets/portrait-4.png" alt="Karan standing in black clothing" loading="lazy" />
          <SectionFooter social={false} />
        </section>

        <section id="experience" className="stage experience" aria-labelledby="experience-title">
          <SectionHeader label="DATA SCIENCE & FRONTEND DEVELOPER" />
          <h2 id="experience-title" className="display-title experience-title">
            <span className="reveal"><LetterLine>WORK</LetterLine></span>
            <span className="reveal" data-delay="120"><LetterLine>EXPERIENCE</LetterLine></span>
          </h2>
          <img className="robot reveal" data-motion="rise" src="/assets/robot.png" alt="" loading="lazy" />
          <div className="project-list">
            <article className="reveal" data-delay="180"><h3>Mandi Intelligence (AI &amp; Data Analytics)</h3><p>Built an intelligent agricultural pricing engine integrating price forecasting, net profit modeling, and transport analysis to assist farmer decision-making.</p></article>
            <article className="reveal" data-delay="300"><h3>AgriVital (Smart Agriculture Concept)</h3><p>Engineered a livestock tracking platform featuring QR-based animal identification, automated treatment records, and withdrawal-period monitoring.</p></article>
          </div>
          <div className="experience-details">
            <p className="reveal">Final-year Data Science student and frontend developer building practical, AI-driven digital products. Focused on machine learning pipelines, predictive modeling, and user-centric web applications that turn real-world data into actionable prototypes.</p>
            <article className="role reveal" data-delay="180"><h3>Lead Developer &amp; ML Engineer (2025 – Present)</h3><p>Mandi Intelligence — Built predictive market-pricing models, profit estimation algorithms, and integrated real-time transport analytics for agricultural decision-making.</p></article>
            <article className="role reveal" data-delay="300"><h3>Full-Stack &amp; Systems Developer (2025)</h3><p>Developed a livestock health-tracking system with QR-code identity tagging, digital medical logs, and automated treatment withdrawal monitoring.</p></article>
            <div className="tech-stack reveal" data-delay="420">
              <h3>Tech Stack</h3>
              <h4>Programming &amp; Development</h4>
              <ul className="tech-badges">{['Python', 'Java', 'JavaScript', 'HTML', 'CSS', 'PHP', 'React', 'Next.js', 'Node.js', 'Flutter', 'Tailwind', 'Sass'].map((tech) => <li key={tech}>{tech}</li>)}</ul>
              <h4>Data Science &amp; AI</h4>
              <ul className="tech-badges">{['PyTorch', 'TensorFlow', 'OpenCV', 'MongoDB', 'MySQL', 'PostgreSQL'].map((tech) => <li key={tech}>{tech}</li>)}</ul>
              <h4>Tools &amp; Platforms</h4>
              <ul className="tech-badges">{['Git', 'GitHub', 'Docker', 'AWS', 'Google Cloud', 'Linux', 'Figma', 'Postman', 'Firebase'].map((tech) => <li key={tech}>{tech}</li>)}</ul>
            </div>
          </div>
          <SectionFooter social={false} />
        </section>

        <section id="contact" className="stage contact" aria-labelledby="contact-title">
          <SectionHeader label="CREATIVE PORTFOLIO" />
          <h2 id="contact-title" className="hero-title reveal"><LetterLine>THANK YOU</LetterLine></h2>
          <img className="portrait contact-portrait reveal" data-motion="rise" src="/assets/portrait-6.png" alt="Karan wearing sunglasses and a black jacket" loading="lazy" />
          <div className="contact-links reveal" data-delay="350">
            <a href="mailto:og.karansawant@gmail.com" data-testid="link-contact-gmail"><span aria-hidden="true">@</span> Gmail</a>
            <a href="https://in.linkedin.com/in/karan-sawant-6811a4422" target="_blank" rel="noopener noreferrer" data-testid="link-contact-linkedin"><span aria-hidden="true">in</span> LinkedIn</a>
            <a href="https://github.com/ogkaransawant-coder" target="_blank" rel="noopener noreferrer" data-testid="link-contact-github"><span aria-hidden="true">&lt;/&gt;</span> GitHub</a>
          </div>
          <SectionFooter school={false} social={false} />
        </section>
      </main>
      <div className="cursor-effect" ref={cursorRef} aria-hidden="true">
        <div className="cursor-glow" ref={glowRef} />
        <div className="cursor-ring" ref={ringRef}><span /></div>
      </div>
    </>
  );
}

export default App;
