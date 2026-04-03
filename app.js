const CONTENT_URLS = ['/shared/site-content.json', '/site-content.json'];
let mockExamTimer = null;

const FREE_MOCK_DEMO = {
  id: 'ft1',
  title: 'IBPS PO Prelims Free Mock 01',
  examTag: 'IBPS PO • Free Test • 100 Questions • 60 Minutes',
  durationMinutes: 60,
  negativeMarking: 0.25,
  sectionTiming: [
    { section: 'English', durationMinutes: 20 },
    { section: 'Reasoning', durationMinutes: 20 },
    { section: 'Quant', durationMinutes: 20 },
  ],
  questions: [
    {
      id: 'e1',
      section: 'English',
      question: 'Choose the antonym of "Increase".',
      options: [
        { id: 'a', text: 'Improve' },
        { id: 'b', text: 'Decline' },
        { id: 'c', text: 'Rise' },
        { id: 'd', text: 'Advance' },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'e2',
      section: 'English',
      question: 'Choose the synonym of "Abundant".',
      options: [
        { id: 'a', text: 'Scarce' },
        { id: 'b', text: 'Plentiful' },
        { id: 'c', text: 'Rigid' },
        { id: 'd', text: 'Averse' },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'e3',
      section: 'English',
      question: 'Choose the grammatically correct sentence.',
      options: [
        { id: 'a', text: 'Each of the students were prepared.' },
        { id: 'b', text: 'Neither of the options are valid.' },
        { id: 'c', text: 'The committee has submitted its report.' },
        { id: 'd', text: 'He do not know the answer.' },
      ],
      correctOptionId: 'c',
    },
    {
      id: 'r1',
      section: 'Reasoning',
      question: 'Find the next number in the series: 2, 5, 10, 17, 26, ?',
      options: [
        { id: 'a', text: '37' },
        { id: 'b', text: '35' },
        { id: 'c', text: '39' },
        { id: 'd', text: '41' },
      ],
      correctOptionId: 'a',
    },
    {
      id: 'r2',
      section: 'Reasoning',
      question: 'Ravi walks 10 m north and then 5 m east. In which direction is he from the start point?',
      options: [
        { id: 'a', text: 'North-West' },
        { id: 'b', text: 'South-East' },
        { id: 'c', text: 'North-East' },
        { id: 'd', text: 'West' },
      ],
      correctOptionId: 'c',
    },
    {
      id: 'r3',
      section: 'Reasoning',
      question: 'Find the odd one out.',
      options: [
        { id: 'a', text: 'Circle' },
        { id: 'b', text: 'Square' },
        { id: 'c', text: 'Triangle' },
        { id: 'd', text: 'Pencil' },
      ],
      correctOptionId: 'd',
    },
    {
      id: 'q1',
      section: 'Quant',
      question: 'If the cost price is 800 and selling price is 920, then the profit percent is:',
      options: [
        { id: 'a', text: '10%' },
        { id: 'b', text: '15%' },
        { id: 'c', text: '18%' },
        { id: 'd', text: '20%' },
      ],
      correctOptionId: 'b',
    },
    {
      id: 'q2',
      section: 'Quant',
      question: 'Simple interest on 5000 at 8% per annum for 2 years is:',
      options: [
        { id: 'a', text: '600' },
        { id: 'b', text: '700' },
        { id: 'c', text: '800' },
        { id: 'd', text: '900' },
      ],
      correctOptionId: 'c',
    },
    {
      id: 'q3',
      section: 'Quant',
      question: 'Average of 10, 20, 30, 40 and 50 is:',
      options: [
        { id: 'a', text: '25' },
        { id: 'b', text: '30' },
        { id: 'c', text: '35' },
        { id: 'd', text: '40' },
      ],
      correctOptionId: 'b',
    },
  ],
};

async function loadContent() {
  let lastError = new Error('Unable to load site content');

  for (const url of CONTENT_URLS) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`Unable to load site content from ${url}`);
        continue;
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMinutesSeconds(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function getMockQuestionState(answer) {
  if (!answer || !answer.visited) return 'not-visited';
  if (answer.markedForReview && answer.selectedOptionId) return 'answered-review';
  if (answer.markedForReview) return 'review';
  if (answer.selectedOptionId) return 'answered';
  return 'not-answered';
}

function getWebsiteApiBase() {
  const saved = window.localStorage.getItem('veteran-api-base');
  if (saved) return saved.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}:4000`;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function buildMockLaunchPath(testId) {
  return `/mock-test?testId=${encodeURIComponent(testId)}`;
}

async function loadPublicMockTests(fallbackTests) {
  try {
    const tests = await fetchJson(`${getWebsiteApiBase()}/api/public/mock-tests`);
    if (!Array.isArray(tests) || !tests.length) return fallbackTests;

    return tests.map((test) => ({
      id: test.id,
      title: test.title,
      examTag: test.examTag,
      durationMinutes: test.durationMinutes,
      totalQuestions: test.totalQuestions,
      sections: test.sections || [],
      launchPath: buildMockLaunchPath(test.id),
    }));
  } catch {
    return fallbackTests;
  }
}

async function loadPublicMockTest(testId) {
  if (!testId) return null;

  try {
    return await fetchJson(`${getWebsiteApiBase()}/api/public/mock-tests/${encodeURIComponent(testId)}`);
  } catch {
    return null;
  }
}

async function loadPublicCourses(fallbackCourses) {
  try {
    const courses = await fetchJson(`${getWebsiteApiBase()}/api/public/courses`);
    if (!Array.isArray(courses) || !courses.length) return fallbackCourses;
    return courses;
  } catch {
    return fallbackCourses;
  }
}

async function loadPublicLiveClasses() {
  try {
    const liveClasses = await fetchJson(`${getWebsiteApiBase()}/api/public/live-classes`);
    if (!Array.isArray(liveClasses)) return [];
    return liveClasses;
  } catch {
    return [];
  }
}

async function purchaseDemoCourse(courseId) {
  return fetchJson(`${getWebsiteApiBase()}/api/student/purchase-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'u1',
      courseId,
      source: 'website',
    }),
  });
}

async function joinWebsiteLiveClass(liveClassId) {
  return fetchJson(`${getWebsiteApiBase()}/api/live-classes/${encodeURIComponent(liveClassId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'u1',
      name: 'Raj Prajapati',
      role: 'student',
    }),
  });
}

async function loadAdminOverview() {
  return fetchJson(`${getWebsiteApiBase()}/api/admin/overview`, {
    headers: buildTeacherHeaders(),
  });
}

async function loadAdminCourses() {
  return fetchJson(`${getWebsiteApiBase()}/api/admin/courses`, {
    headers: buildTeacherHeaders(),
  });
}

async function loadAdminLiveClasses() {
  return fetchJson(`${getWebsiteApiBase()}/api/admin/live-classes`, {
    headers: buildTeacherHeaders(),
  });
}

async function loadAdminStudents() {
  return fetchJson(`${getWebsiteApiBase()}/api/admin/students`, {
    headers: buildTeacherHeaders(),
  });
}

async function loadAdminOrders() {
  return fetchJson(`${getWebsiteApiBase()}/api/admin/orders`, {
    headers: buildTeacherHeaders(),
  });
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

async function submitWebsiteMock(testId, answers) {
  return fetchJson(`${getWebsiteApiBase()}/api/mock-tests/${encodeURIComponent(testId)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'website-demo-student',
      answers: Object.fromEntries(
        Object.entries(answers).map(([questionId, answer]) => [questionId, { selectedOptionId: answer.selectedOptionId }]),
      ),
    }),
  });
}

function getStoredTeacherApiKey() {
  return window.localStorage.getItem('veteran-teacher-api-key') || '';
}

function setStoredTeacherApiKey(value) {
  window.localStorage.setItem('veteran-teacher-api-key', value);
}

function buildTeacherHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const teacherKey = getStoredTeacherApiKey();
  if (teacherKey) {
    headers['x-teacher-key'] = teacherKey;
  }
  return headers;
}

function getStoredTheme() {
  const saved = window.localStorage.getItem('veteran-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  window.localStorage.setItem('veteran-theme', theme);

  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  toggle.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

function setupThemeToggle() {
  applyTheme(getStoredTheme());

  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });
}

function renderBrand(branding) {
  const target = document.getElementById('nav-brand');
  target.innerHTML = `
    <img src="${branding.logoUrl}" alt="${branding.appName}" />
    <div>
      <div>${branding.appName}</div>
      <small>${branding.teacherName} | Quant + Reasoning</small>
    </div>
  `;
}

function renderFooter(content) {
  const footer = document.getElementById('site-footer');
  footer.innerHTML = `
    <div class="footer-panel">
      <div>
        <strong>${content.branding.appName}</strong>
        <div>${content.branding.teacherName} | All Rights Reserved</div>
      </div>
      <div class="footer-note">${content.about.headline}</div>
    </div>
  `;
}

function heroStats(content) {
  return [
    { value: '150K+', label: 'Community strength' },
    { value: `${content.catalogCourses.length}+`, label: 'Structured flagship batches' },
    { value: `${content.faqs.length}`, label: 'Clear student FAQs' },
  ];
}

function setupEnquiryForm() {
  const form = document.getElementById('enquiry-form');
  const status = document.getElementById('enquiry-status');
  if (!(form instanceof HTMLFormElement) || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    status.textContent = 'Thanks for reaching out. Our team will connect with you soon.';
  });
}

function renderHome(content) {
  const featuredOffers = content.highlightedCourses
    .map(
      (course) => `
        <article class="hero-offer-card">
          <div class="token" style="background:${course.accent}">${course.thumbnail}</div>
          <div class="offer-copy">
            <small>${course.label}</small>
            <h3>${course.title}</h3>
            <div class="price-row">
              <strong>${formatINR(course.price)}</strong>
              ${course.originalPrice ? `<del>${formatINR(course.originalPrice)}</del>` : ''}
              ${course.discountText ? `<span class="discount-chip">${course.discountText}</span>` : ''}
            </div>
            <a class="inline-link" href="${course.buyUrl}" target="_blank" rel="noreferrer">Buy now</a>
          </div>
        </article>
      `,
    )
    .join('');

  const stats = heroStats(content)
    .map(
      (item) => `
        <div class="stat-card">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </div>
      `,
    )
    .join('');

  const offerings = content.offerings
    .map(
      (item, index) => `
        <article class="offer-card">
          <div class="icon-burst">${index + 1}</div>
          <h3>${item.title}</h3>
          <p class="card-copy">${item.description}</p>
        </article>
      `,
    )
    .join('');

  const reviews = content.testimonials
    .slice(0, 6)
    .map(
      (item) => `
        <article class="review-card">
          <div class="review-top">
            <div>
              <div class="review-name">${item.name}</div>
              <div class="review-result">${item.result}</div>
            </div>
            <div class="quote-mark">“</div>
          </div>
          <div class="meta-copy">${item.quote}</div>
        </article>
      `,
    )
    .join('');

  const faqs = content.faqs
    .map(
      (item) => `
        <article class="faq-card">
          <h3>${item.question}</h3>
          <div class="faq-answer">${item.answer}</div>
        </article>
      `,
    )
    .join('');

  const champions = (content.champions || [])
    .map(
      (item) => `
        <article class="champion-card">
          <div class="champion-avatar">${getInitials(item.name)}</div>
          <div class="champion-copy">
            <h3>${item.name}</h3>
            <p class="card-copy">${item.result}</p>
          </div>
        </article>
      `,
    )
    .join('');

  const main = document.getElementById('page-content');
  main.innerHTML = `
    <section class="hero hero-veteran">
      <div class="hero-copy glass-panel">
        <span class="eyebrow">${content.hero.eyebrow}</span>
        <h1>${content.hero.title}</h1>
        <p>${content.branding.tagline}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="/courses">${content.hero.primaryCtaLabel}</a>
          <a class="button button-secondary" href="/login">${content.hero.secondaryCtaLabel}</a>
        </div>
        <div class="hero-stats">${stats}</div>
      </div>

      <aside class="hero-stage glass-panel">
        <div class="hero-stage-media">
          <img src="${content.branding.teacherPhotoUrl}" alt="${content.branding.teacherName}" />
          <div class="hero-stage-badge">
            <span class="soft-label">${content.community.eyebrow}</span>
            <strong>${content.community.headline}</strong>
            <small>${content.branding.teacherName} | ${content.branding.teacherTitle}</small>
          </div>
        </div>

        <div class="hero-stage-panel">
          <div class="hero-stage-head">
            <div>
              <div class="soft-label">Get early access</div>
              <h3>Courses, tests, and student login in one place</h3>
            </div>
            <a class="mini-link" href="/login">Login</a>
          </div>
          <p class="hero-stage-copy">Login from the website or app to continue your courses, access upcoming classes, and stay connected to the Veteran learning journey.</p>
        </div>
      </aside>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Featured offers</div>
          <h2 class="section-title">With our curated courses</h2>
        </div>
        <a class="button button-secondary" href="/courses">View all courses</a>
      </div>
      <div class="featured-offers-grid">${featuredOffers}</div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Best offerings for you</div>
          <h2 class="section-title">Get ready for your exam with best content and latest test series</h2>
        </div>
      </div>
      <div class="offer-grid">${offerings}</div>
    </section>

    <section class="section-block">
      <div class="community-panel">
        <div>
          <a class="button button-primary community-cta" href="/login">Get early access</a>
          <div class="eyebrow">${content.community.eyebrow}</div>
          <h2 class="section-title">${content.community.headline}</h2>
          <p class="section-copy">${content.community.description}</p>
          <p class="section-copy">${content.community.description2}</p>
        </div>
        <div class="community-photo-wrap">
          <img src="${content.branding.teacherPhotoUrl}" alt="${content.branding.teacherName}" />
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Reviews</div>
          <h2 class="section-title">What our champs saying</h2>
        </div>
      </div>
      <div class="review-grid">${reviews}</div>
    </section>

    <section class="split-section">
      <article class="info-panel">
        <div class="eyebrow">Application</div>
        <h3>${content.branding.appName}</h3>
        <p class="section-copy">${content.appPromo.description}</p>
        <div class="action-row">
          <a class="button button-primary" href="${content.branding.appDownloadUrl}" target="_blank" rel="noreferrer">${content.appPromo.ctaLabel}</a>
          <a class="button button-secondary" href="/login">Student Access</a>
        </div>
      </article>
      <article class="about-image-card">
        <img src="${content.branding.teacherPhotoUrl}" alt="${content.branding.teacherName}" />
      </article>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">FAQs</div>
          <h2 class="section-title">Frequently asked questions</h2>
        </div>
      </div>
      <div class="faq-grid">${faqs}</div>
    </section>

    <section class="split-section">
      <article class="info-panel">
        <div class="eyebrow">${content.querySection.eyebrow}</div>
        <h3>${content.querySection.headline}</h3>
        <p class="section-copy">${content.querySection.description}</p>
        <div class="feature-list">
          <div class="feature-item"><span class="feature-dot"></span><div>Ask about batches, pricing, live classes, or app access.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Share your details and our team can guide you to the right preparation path.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Get clarity on courses, schedules, and the next step for your exam journey.</div></div>
        </div>
      </article>

      <article class="info-panel enquiry-panel">
        <form id="enquiry-form" class="enquiry-form">
          <input name="name" type="text" placeholder="Name" required />
          <input name="phone" type="tel" placeholder="Phone Number" required />
          <input name="email" type="email" placeholder="Email ID" required />
          <button class="button button-primary enquiry-submit" type="submit">${content.querySection.submitLabel}</button>
        </form>
        <p class="form-note" id="enquiry-status">Tell us what you need and our team will guide you.</p>
      </article>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Success Stories</div>
          <h2 class="section-title">Success Stories Of Our Champions</h2>
        </div>
      </div>
      <div class="champions-grid">${champions}</div>
    </section>

    <section class="split-section">
      <article class="about-image-card">
        <img src="${content.branding.teacherPhotoUrl}" alt="${content.about.headline}" />
      </article>
      <article class="about-card">
        <div class="eyebrow">${content.about.sectionTitle}</div>
        <h3>${content.about.headline}</h3>
        <p class="section-copy">${content.about.specialization}</p>
        <ul>
          ${content.about.achievements.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        ${content.about.paragraphs.map((text) => `<p class="section-copy">${text}</p>`).join('')}
      </article>
    </section>
  `;

  setupEnquiryForm();
}

async function renderCourses(content) {
  const publicCourses = await loadPublicCourses(content.catalogCourses);
  const cards = publicCourses
    .map(
      (course) => `
        <article class="course-card">
          <div class="top-row">
            <div>
              <span class="pill">${course.category}</span>
              <h3 class="course-title">${course.title}</h3>
              <div class="course-meta">${course.instructor} | ${course.totalDurationHours}h | ${course.level}</div>
            </div>
            <div class="token" style="background:linear-gradient(135deg, var(--brand), var(--brand-deep))">${course.thumbnail}</div>
          </div>
          <div class="price-row">
            <strong>${formatINR(course.price)}</strong>
            ${course.originalPrice ? `<del>${formatINR(course.originalPrice)}</del>` : ''}
          </div>
          <p class="meta-copy">${course.description}</p>
          <div class="course-tags">
            ${(course.badgeLabels || []).map((tag) => `<span class="badge">${tag}</span>`).join('')}
            ${course.couponEnabled ? '<span class="badge">COUPON READY</span>' : ''}
          </div>
          <div class="module-list">
            ${course.modules
              .slice(0, 2)
              .map(
                (module) => `
                  <div class="module-item">
                    <strong>${module.title}</strong>
                    <div class="meta-copy">${module.lessons.length} lessons</div>
                  </div>
                `,
              )
              .join('')}
          </div>
          <div class="action-row">
            <button class="button button-primary website-enroll-btn" type="button" data-course-id="${course.id}">Unlock Demo Access</button>
          </div>
        </article>
      `,
    )
    .join('');

  const featuredCourses = publicCourses.filter((course) => course.featured).slice(0, 3);
  const featureCards = (featuredCourses.length ? featuredCourses : content.highlightedCourses)
    .map(
      (course) => `
        <article class="feature-card">
          <div class="icon-burst" style="background:${course.accent || 'linear-gradient(135deg, var(--brand), var(--brand-deep))'}">${course.thumbnail}</div>
          <h3>${course.title}</h3>
          <p class="card-copy">${course.label || course.description}</p>
          <div class="price-row">
            <strong>${formatINR(course.price)}</strong>
            ${course.originalPrice ? `<del>${formatINR(course.originalPrice)}</del>` : ''}
          </div>
          <button class="button button-secondary website-enroll-btn" type="button" data-course-id="${course.id}">Unlock Demo</button>
        </article>
      `,
    )
    .join('');

  const main = document.getElementById('page-content');
  main.innerHTML = `
    <section class="page-hero">
        <div class="glass-panel">
          <div class="eyebrow">Courses</div>
          <h1>Explore our public course catalog</h1>
          <p>Browse Veteran batches, books, and preparation programs designed for bank and insurance exam aspirants.</p>
        </div>
      </section>

      <section class="section-block">
        <article class="info-panel">
          <div class="eyebrow">Demo purchase flow</div>
          <h3>Unlock courses like a real student demo</h3>
          <p class="section-copy">Use the buttons below to simulate a purchase for the demo student account. Newly unlocked courses can then be opened in the app too when both use the same backend.</p>
          <p class="form-note" id="course-demo-status">The demo student is Raj Prajapati. Use the admin console later for manual enrollments and staff-side controls.</p>
        </article>
      </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Courses</div>
          <h2 class="section-title">Structured Veteran learning paths</h2>
        </div>
      </div>
      <div class="course-grid">${cards}</div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Featured offers</div>
          <h2 class="section-title">Highlighted offers</h2>
        </div>
      </div>
      <div class="feature-grid">${featureCards}</div>
    </section>
  `;

  const status = document.getElementById('course-demo-status');
  document.querySelectorAll('.website-enroll-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const courseId = button.getAttribute('data-course-id');
      if (!courseId || !status) return;

      try {
        const response = await purchaseDemoCourse(courseId);
        status.textContent = response.message || 'Demo course unlocked successfully.';
      } catch (error) {
        status.textContent = `Unable to unlock demo access: ${error.message}`;
      }
    });
  });
}

async function renderLiveClasses(content) {
  const liveClasses = await loadPublicLiveClasses();
  const liveNow = liveClasses.filter((item) => item.status === 'live');
  const scheduled = liveClasses.filter((item) => item.status === 'scheduled');
  const liveHighlights = [
    ...liveNow.map(
      (item) => `
        <article class="feature-card">
          <div class="icon-burst">LIVE</div>
          <h3>${item.title}</h3>
          <p class="card-copy">${item.mentor} | Room ${item.roomCode}</p>
          <p class="meta-copy">${formatDateTime(item.startsAt)}</p>
          <button class="button button-primary website-live-join-btn" type="button" data-live-class-id="${item.id}">Join Demo Live</button>
        </article>
      `,
    ),
    ...scheduled.map(
      (item) => `
        <article class="feature-card">
          <div class="icon-burst">NEXT</div>
          <h3>${item.title}</h3>
          <p class="card-copy">${item.mentor}</p>
          <p class="meta-copy">${formatDateTime(item.startsAt)}</p>
          <button class="button button-secondary website-live-join-btn" type="button" data-live-class-id="${item.id}">Mark Joining Demo</button>
        </article>
      `,
    ),
  ].join('');

  const main = document.getElementById('page-content');
  main.innerHTML = `
    <section class="page-hero">
      <div class="glass-panel">
        <div class="eyebrow">Live Classes</div>
        <h1>Clearer access to live learning</h1>
        <p>Students should be able to find the live option quickly, join with confidence, and continue from the same portal without confusion.</p>
      </div>
    </section>

    <section class="split-section">
      <article class="info-panel">
        <div class="eyebrow">Student flow</div>
        <h3>How the live-class path should feel</h3>
        <div class="feature-list">
          <div class="feature-item"><span class="feature-dot"></span><div>See active or upcoming live classes clearly from the website.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Tap once to continue into the student portal.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Open class, notes, chat, and later recordings from the same account.</div></div>
        </div>
        <div class="action-row">
          <a class="button button-primary" href="/login">Open student portal</a>
          <a class="button button-secondary" href="/courses">Explore courses</a>
        </div>
      </article>

      <article class="about-card">
        <div class="eyebrow">Why this matters</div>
        <h3>Less confusion, better student confidence</h3>
        <p class="section-copy">A modern platform should feel obvious even to a first-time student. Courses, live classes, and login should all be visible without crowded navigation or too many decisions.</p>
        <p class="section-copy">${content.branding.teacherName} can keep teaching, while students get a cleaner and more reliable entry point.</p>
      </article>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Live schedule</div>
          <h2 class="section-title">Current live and upcoming classes</h2>
        </div>
      </div>
      <div class="feature-grid">${liveHighlights}</div>
      <p class="form-note" id="live-demo-status">Use the demo join buttons above to simulate how a student joins from the website.</p>
    </section>
  `;

  const status = document.getElementById('live-demo-status');
  document.querySelectorAll('.website-live-join-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const liveClassId = button.getAttribute('data-live-class-id');
      if (!liveClassId || !status) return;

      try {
        const response = await joinWebsiteLiveClass(liveClassId);
        status.textContent = `Demo student joined ${response.liveClass?.title || 'the selected live class'}.`;
      } catch (error) {
        status.textContent = `Unable to join demo live class: ${error.message}`;
      }
    });
  });
}

async function renderFreeTests(content) {
  const fallbackTests = (content.freeTests.tests || []).map((test) => ({
    ...test,
    launchPath: test.launchPath || buildMockLaunchPath(test.id),
  }));
  const tests = await loadPublicMockTests(fallbackTests);
  const cards = tests
    .map(
      (test) => `
        <article class="free-test-card">
          <div class="free-test-top">
            <span class="pill">Free Test</span>
            <span class="badge">${test.durationMinutes} mins</span>
          </div>
          <h3>${test.title}</h3>
          <p class="card-copy">${test.examTag}</p>
          <div class="free-test-meta">
            <span>${test.totalQuestions} Questions</span>
            <span>${test.sections.join(' | ')}</span>
          </div>
          <a class="button button-primary" href="${test.launchPath}">Start Free Mock</a>
        </article>
      `,
    )
    .join('');

  const main = document.getElementById('page-content');
  main.innerHTML = `
    <section class="page-hero">
      <div class="glass-panel">
        <div class="eyebrow">Free Tests</div>
        <h1>${content.freeTests.title}</h1>
        <p>Total (${content.freeTests.total})</p>
      </div>
    </section>

    <section class="free-tests-grid">
      <article class="info-panel">
        <div class="eyebrow">Live Free Mock</div>
        <h3>Attempt a banking-style free test</h3>
        <p class="section-copy">${content.freeTests.description}</p>
        <div class="free-test-list">${cards}</div>
      </article>
      <article class="info-panel">
        <div class="eyebrow">What you get</div>
        <h3>IBPS-style mock flow on the new website</h3>
        <div class="feature-list">
          <div class="feature-item"><span class="feature-dot"></span><div>Question palette with answered, review, and not visited states.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Section-locked timer flow inspired by banking prelims exams.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Instant score summary after the mock ends.</div></div>
        </div>
        <div class="action-row">
          <a class="button button-primary" href="${tests[0]?.launchPath || '/mock-test'}">Open free mock</a>
          <a class="button button-secondary" href="/courses">Explore courses</a>
        </div>
      </article>
    </section>
  `;
}

async function renderMockTest() {
  if (mockExamTimer) {
    window.clearInterval(mockExamTimer);
    mockExamTimer = null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const requestedTestId = searchParams.get('testId');
  const liveTest = (await loadPublicMockTest(requestedTestId)) || FREE_MOCK_DEMO;
  const sections = (liveTest.sectionTiming || []).map((item) => item.section);
  const answers = Object.fromEntries(
    liveTest.questions.map((question) => [
      question.id,
      {
        selectedOptionId: null,
        markedForReview: false,
        visited: false,
      },
    ]),
  );

  const state = {
    started: false,
    sectionIndex: 0,
    currentQuestionId: liveTest.questions[0]?.id ?? null,
    sectionRemainingSec: (liveTest.sectionTiming?.[0]?.durationMinutes || liveTest.durationMinutes || 20) * 60,
    answers,
    result: null,
    submitting: false,
  };

  const getSectionQuestions = (section) => liveTest.questions.filter((question) => question.section === section);
  const getCurrentQuestion = () => liveTest.questions.find((question) => question.id === state.currentQuestionId) || null;
  const currentSection = () => sections[state.sectionIndex];

  const startExam = () => {
    state.started = true;
    moveToSection(0);
  };

  const moveToSection = (index) => {
    const section = sections[index];
    if (!section) return;

    state.sectionIndex = index;
    state.sectionRemainingSec = (liveTest.sectionTiming?.[index]?.durationMinutes || liveTest.durationMinutes || 20) * 60;
    state.currentQuestionId = getSectionQuestions(section)[0]?.id ?? null;
    render();
    startTimer();
  };

  const finalizeLocalResult = () => {
    if (mockExamTimer) {
      window.clearInterval(mockExamTimer);
      mockExamTimer = null;
    }

    let correct = 0;
    let wrong = 0;
    let attempted = 0;

    const sectionBreakdown = sections.map((section) => {
      const sectionQuestions = getSectionQuestions(section);
      let sectionAttempted = 0;
      let sectionCorrect = 0;
      let sectionScore = 0;

      sectionQuestions.forEach((question) => {
        const answer = state.answers[question.id];
        if (!answer?.selectedOptionId) return;
        attempted += 1;
        sectionAttempted += 1;

        if (answer.selectedOptionId === question.correctOptionId) {
          correct += 1;
          sectionCorrect += 1;
          sectionScore += 1;
        } else {
          wrong += 1;
          sectionScore -= liveTest.negativeMarking;
        }
      });

      return {
        section,
        attempted: sectionAttempted,
        correct: sectionCorrect,
        score: Number(sectionScore.toFixed(2)),
      };
    });

    const unanswered = liveTest.questions.length - attempted;
    const score = Number((correct - wrong * liveTest.negativeMarking).toFixed(2));
    const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    state.result = {
      attempted,
      correct,
      wrong,
      unanswered,
      score,
      accuracyPercent,
      sectionBreakdown,
    };

    render();
  };

  const submitMock = async () => {
    if (mockExamTimer) {
      window.clearInterval(mockExamTimer);
      mockExamTimer = null;
    }

    const canScoreLocally = liveTest.questions.every((question) => !!question.correctOptionId);
    if (canScoreLocally) {
      finalizeLocalResult();
      return;
    }

    state.submitting = true;
    render();

    try {
      const remoteResult = await submitWebsiteMock(liveTest.id, state.answers);
      state.result = {
        attempted: remoteResult.attempted,
        correct: remoteResult.correct,
        wrong: remoteResult.wrong,
        unanswered: remoteResult.unanswered,
        score: remoteResult.score,
        accuracyPercent: remoteResult.accuracyPercent,
        sectionBreakdown: remoteResult.sectionBreakdown,
      };
    } catch {
      state.result = {
        attempted: 0,
        correct: 0,
        wrong: 0,
        unanswered: liveTest.questions.length,
        score: 0,
        accuracyPercent: 0,
        sectionBreakdown: sections.map((section) => ({
          section,
          attempted: 0,
          correct: 0,
          score: 0,
        })),
      };
    }

    state.submitting = false;
    render();
  };

  const moveToNext = () => {
    const sectionQuestionIds = getSectionQuestions(currentSection()).map((question) => question.id);
    const currentIndex = sectionQuestionIds.findIndex((questionId) => questionId === state.currentQuestionId);

    if (currentIndex >= sectionQuestionIds.length - 1) {
      if (state.sectionIndex >= sections.length - 1) {
        submitMock();
        return;
      }

      moveToSection(state.sectionIndex + 1);
      return;
    }

    state.currentQuestionId = sectionQuestionIds[currentIndex + 1];
    state.answers[state.currentQuestionId].visited = true;
    render();
  };

  const startTimer = () => {
    if (mockExamTimer) {
      window.clearInterval(mockExamTimer);
    }

    mockExamTimer = window.setInterval(() => {
      state.sectionRemainingSec -= 1;

      if (state.sectionRemainingSec <= 0) {
        if (state.sectionIndex >= sections.length - 1) {
          submitMock();
          return;
        }

        moveToSection(state.sectionIndex + 1);
        return;
      }

      render();
    }, 1000);
  };

  const render = () => {
    const main = document.getElementById('page-content');
    if (!main) return;

    if (state.result) {
      main.innerHTML = `
        <section class="page-hero">
          <div class="glass-panel">
            <div class="eyebrow">Mock Result</div>
            <h1>${liveTest.title}</h1>
            <p>Score ${state.result.score}/${liveTest.questions.length} • Accuracy ${state.result.accuracyPercent}%</p>
          </div>
        </section>

        <section class="split-section">
          <article class="info-panel">
            <div class="eyebrow">Performance</div>
            <h3>Free mock completed</h3>
            <div class="feature-list">
              <div class="feature-item"><span class="feature-dot"></span><div>Attempted: ${state.result.attempted}</div></div>
              <div class="feature-item"><span class="feature-dot"></span><div>Correct: ${state.result.correct}</div></div>
              <div class="feature-item"><span class="feature-dot"></span><div>Wrong: ${state.result.wrong}</div></div>
              <div class="feature-item"><span class="feature-dot"></span><div>Unanswered: ${state.result.unanswered}</div></div>
            </div>
            <div class="action-row">
              <button class="button button-primary" id="retry-mock" type="button">Retry Mock</button>
              <a class="button button-secondary" href="/free-tests">Back to Free Tests</a>
            </div>
          </article>
          <article class="info-panel">
            <div class="eyebrow">Sectional Breakdown</div>
            <h3>Section-wise score</h3>
            <div class="feature-list">
              ${state.result.sectionBreakdown
                .map(
                  (item) => `
                    <div class="feature-item">
                      <span class="feature-dot"></span>
                      <div>${item.section}: ${item.score} (${item.correct}/${item.attempted})</div>
                    </div>
                  `,
                )
                .join('')}
            </div>
          </article>
        </section>
      `;

      document.getElementById('retry-mock')?.addEventListener('click', () => renderMockTest());
      return;
    }

    if (!state.started) {
      const sectionOverview = (liveTest.sectionTiming || [])
        .map(
          (item) => `
            <div class="feature-item">
              <span class="feature-dot"></span>
              <div>${item.section}: ${item.durationMinutes} mins</div>
            </div>
          `,
        )
        .join('');

      const instructions = (liveTest.instructions || [])
        .map(
          (instruction) => `
            <div class="feature-item">
              <span class="feature-dot"></span>
              <div>${instruction}</div>
            </div>
          `,
        )
        .join('');

      main.innerHTML = `
        <section class="page-hero">
          <div class="glass-panel">
            <div class="eyebrow">Mock Instructions</div>
            <h1>${liveTest.title}</h1>
            <p>${liveTest.examTag}</p>
          </div>
        </section>

        <section class="mock-intro-grid">
          <article class="info-panel">
            <div class="eyebrow">Before You Start</div>
            <h3>Read this just like a real banking exam</h3>
            <div class="feature-list">${instructions}</div>
            <div class="action-row">
              <button class="button button-primary" id="start-mock" type="button">Start Test Now</button>
              <a class="button button-secondary" href="/free-tests">Back to Free Tests</a>
            </div>
          </article>

          <article class="info-panel">
            <div class="eyebrow">Test Snapshot</div>
            <h3>Exam structure</h3>
            <div class="feature-list">
              <div class="feature-item"><span class="feature-dot"></span><div>Total questions: ${liveTest.questions.length}</div></div>
              <div class="feature-item"><span class="feature-dot"></span><div>Total duration: ${liveTest.durationMinutes} mins</div></div>
              <div class="feature-item"><span class="feature-dot"></span><div>Negative marking: ${liveTest.negativeMarking} per wrong answer</div></div>
            </div>
            <div class="mock-intro-sections">
              ${sectionOverview}
            </div>
          </article>
        </section>
      `;

      document.getElementById('start-mock')?.addEventListener('click', startExam);
      return;
    }

    const section = currentSection();
    const sectionQuestions = getSectionQuestions(section);
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    state.answers[currentQuestion.id].visited = true;
    const currentQuestionIndex = sectionQuestions.findIndex((question) => question.id === currentQuestion.id);
    const currentState = getMockQuestionState(state.answers[currentQuestion.id]);

    const sectionCards = sections
      .map((item, index) => {
        const sectionItems = getSectionQuestions(item);
        const answered = sectionItems.filter((question) => !!state.answers[question.id]?.selectedOptionId).length;
        const review = sectionItems.filter((question) => !!state.answers[question.id]?.markedForReview).length;
        return `
          <div class="mock-section-chip ${index === state.sectionIndex ? 'current' : ''} ${index < state.sectionIndex ? 'done' : ''}">
            <strong>${item}</strong>
            <span>Answered ${answered}/${sectionItems.length}</span>
            <span>Review ${review}</span>
          </div>
        `;
      })
      .join('');

    const palette = sectionQuestions
      .map((question, index) => {
        const questionState = getMockQuestionState(state.answers[question.id]);
        return `
          <button
            class="mock-palette-btn ${questionState} ${question.id === currentQuestion.id ? 'current' : ''}"
            type="button"
            data-question-id="${question.id}"
          >
            ${index + 1}
          </button>
        `;
      })
      .join('');

    const options = currentQuestion.options
      .map(
        (option) => `
          <button
            class="mock-option ${state.answers[currentQuestion.id]?.selectedOptionId === option.id ? 'selected' : ''}"
            type="button"
            data-option-id="${option.id}"
          >
            <span class="mock-option-badge">${option.id.toUpperCase()}</span>
            <span>${option.text}</span>
          </button>
        `,
      )
      .join('');

    main.innerHTML = `
      <section class="page-hero">
        <div class="glass-panel">
          <div class="eyebrow">IBPS-Style Free Mock</div>
          <h1>${liveTest.title}</h1>
          <p>${liveTest.examTag}</p>
        </div>
      </section>

      <section class="mock-shell">
        <div class="mock-topbar">
          <div class="mock-top-card">
            <div class="soft-label">Section Locked Mode</div>
            <h3>${section}</h3>
            <p class="card-copy">Move within the current section. The next section opens only when the timer ends or you finish the section.</p>
          </div>
          <div class="mock-timer-card">
            <span>Time Left</span>
            <strong>${formatMinutesSeconds(state.sectionRemainingSec)}</strong>
            <small>Current section timer</small>
          </div>
        </div>

        <div class="mock-sections-row">${sectionCards}</div>

        <div class="mock-grid">
          <article class="mock-main-card">
            <div class="mock-question-head">
              <div>
                <div class="eyebrow">Question ${currentQuestionIndex + 1} of ${sectionQuestions.length}</div>
                <h3>${currentQuestion.question}</h3>
              </div>
              <div class="mock-status-pill ${currentState}">${currentState.replace('-', ' ')}</div>
            </div>

            <div class="mock-instruction-box">
              <strong>Instructions</strong>
              <p>Choose the correct option. Use the buttons below to clear response or mark the current question for review.</p>
            </div>

            <div class="mock-options">${options}</div>

            <div class="mock-actions-row">
              <button class="button button-secondary" type="button" id="clear-response">Clear Response</button>
              <button class="button button-secondary" type="button" id="mark-review">Mark for Review & Next</button>
              <button class="button button-primary" type="button" id="save-next">
                ${currentQuestionIndex >= sectionQuestions.length - 1
                  ? state.sectionIndex >= sections.length - 1
                    ? state.submitting
                      ? 'Submitting...'
                      : 'Save & Submit'
                    : 'Save & Next Section'
                  : 'Save & Next'}
              </button>
            </div>
          </article>

          <aside class="mock-sidebar-card">
            <h3>Question Palette</h3>
            <div class="mock-legend">
              <div><span class="legend-box answered"></span>Answered</div>
              <div><span class="legend-box not-answered"></span>Visited</div>
              <div><span class="legend-box review"></span>Review</div>
              <div><span class="legend-box answered-review"></span>Ans & Review</div>
              <div><span class="legend-box not-visited"></span>Not visited</div>
            </div>
            <div class="mock-palette">${palette}</div>
          </aside>
        </div>
      </section>
    `;

    document.querySelectorAll('[data-question-id]').forEach((button) => {
      button.addEventListener('click', () => {
        state.currentQuestionId = button.getAttribute('data-question-id');
        render();
      });
    });

    document.querySelectorAll('[data-option-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const optionId = button.getAttribute('data-option-id');
        state.answers[currentQuestion.id].selectedOptionId = optionId;
        state.answers[currentQuestion.id].visited = true;
        render();
      });
    });

    document.getElementById('clear-response')?.addEventListener('click', () => {
      state.answers[currentQuestion.id].selectedOptionId = null;
      state.answers[currentQuestion.id].visited = true;
      render();
    });

    document.getElementById('mark-review')?.addEventListener('click', () => {
      state.answers[currentQuestion.id].markedForReview = true;
      state.answers[currentQuestion.id].visited = true;
      moveToNext();
    });

    document.getElementById('save-next')?.addEventListener('click', async () => {
      if (state.submitting) return;
      state.answers[currentQuestion.id].visited = true;
      if (currentQuestionIndex >= sectionQuestions.length - 1 && state.sectionIndex >= sections.length - 1) {
        await submitMock();
        return;
      }

      moveToNext();
    });
  };

  render();
}

async function renderAdminConsole() {
  const main = document.getElementById('page-content');
  if (!main) return;

  main.innerHTML = `
    <section class="page-hero">
      <div class="glass-panel">
        <div class="eyebrow">Backend Console</div>
        <h1>Manage the demo platform from one place</h1>
        <p>Add courses, schedule live classes, enroll students, and inspect orders before showing the platform to your client.</p>
      </div>
    </section>

    <section class="admin-console-grid">
      <article class="info-panel">
        <div class="eyebrow">Connection</div>
        <h3>Backend + admin access</h3>
        <div class="teacher-form">
          <input id="admin-api-base" type="text" placeholder="API Base URL" />
          <input id="admin-api-key" type="text" placeholder="Teacher API Key (if configured)" />
        </div>
        <div class="action-row">
          <a class="button button-secondary" href="/teacher-tests">Open Test Manager</a>
        </div>
        <p class="form-note" id="admin-console-status">Connect this page to the backend and use it as your daily demo console.</p>
      </article>

      <article class="info-panel">
        <div class="eyebrow">Overview</div>
        <h3>Demo platform status</h3>
        <div class="admin-overview-grid" id="admin-overview-grid"></div>
      </article>
    </section>

    <section class="admin-console-grid">
      <article class="info-panel">
        <div class="eyebrow">Create Course</div>
        <h3>Add a new course batch</h3>
        <form id="admin-course-form" class="teacher-form">
          <input name="title" type="text" placeholder="Course Title" required />
          <input name="category" type="text" placeholder="Category" value="Banking Exams" required />
          <input name="instructor" type="text" placeholder="Instructor" value="Yashraj Singh Chauhan" required />
          <div class="teacher-mode-grid">
            <select name="level">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <input name="price" type="number" min="0" placeholder="Price" value="999" />
            <input name="originalPrice" type="number" min="0" placeholder="Original Price" value="1499" />
          </div>
          <input name="totalDurationHours" type="number" min="1" placeholder="Duration Hours" value="60" />
          <input name="thumbnail" type="text" maxlength="3" placeholder="Short badge like RC" value="NB" />
          <input name="tags" type="text" placeholder="Tags comma separated" value="New Batch, Demo" />
          <textarea name="description" placeholder="Course description"></textarea>
          <label class="teacher-check"><input name="featured" type="checkbox" /> Mark as featured</label>
          <label class="teacher-check"><input name="couponEnabled" type="checkbox" checked /> Coupons enabled</label>
          <button class="button button-primary enquiry-submit" type="submit">Create Course</button>
        </form>
      </article>

      <article class="info-panel">
        <div class="eyebrow">Schedule Live Class</div>
        <h3>Add a new live session</h3>
        <form id="admin-live-form" class="teacher-form">
          <input name="title" type="text" placeholder="Live Class Title" required />
          <input name="mentor" type="text" placeholder="Mentor Name" value="Yashraj Singh Chauhan" required />
          <select name="courseId" id="admin-live-course-select"></select>
          <div class="teacher-mode-grid">
            <input name="startsAt" type="datetime-local" required />
            <input name="endsAt" type="datetime-local" required />
            <select name="status">
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>
          </div>
          <input name="roomCode" type="text" placeholder="Room Code" value="LIVE-101" />
          <label class="teacher-check"><input name="isPublic" type="checkbox" checked /> Show on website/app</label>
          <button class="button button-primary enquiry-submit" type="submit">Create Live Class</button>
        </form>
      </article>
    </section>

    <section class="admin-console-grid">
      <article class="info-panel">
        <div class="eyebrow">Enroll Student</div>
        <h3>Grant course access manually</h3>
        <form id="admin-enrollment-form" class="teacher-form">
          <select name="userId" id="admin-student-select"></select>
          <select name="courseId" id="admin-course-select"></select>
          <textarea name="notes" placeholder="Optional note for this enrollment"></textarea>
          <button class="button button-primary enquiry-submit" type="submit">Create Enrollment</button>
        </form>
      </article>

      <article class="info-panel">
        <div class="eyebrow">Client Demo Tip</div>
        <h3>Best way to show this backend console</h3>
        <div class="feature-list">
          <div class="feature-item"><span class="feature-dot"></span><div>Create one new course here.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Create one live class and set it to live.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Enroll the demo student manually if needed.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Then open the website and app to show the same data appearing there.</div></div>
        </div>
      </article>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Managed Content</div>
          <h2 class="section-title">Courses and live classes in the backend</h2>
        </div>
      </div>
      <div class="admin-console-grid">
        <article class="info-panel">
          <h3>Courses</h3>
          <div class="admin-list" id="admin-courses-list"></div>
        </article>
        <article class="info-panel">
          <h3>Live Classes</h3>
          <div class="admin-list" id="admin-live-list"></div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Students and Orders</div>
          <h2 class="section-title">Current backend records</h2>
        </div>
      </div>
      <div class="admin-console-grid">
        <article class="info-panel">
          <h3>Students</h3>
          <div class="admin-list" id="admin-students-list"></div>
        </article>
        <article class="info-panel">
          <h3>Orders</h3>
          <div class="admin-list" id="admin-orders-list"></div>
        </article>
      </div>
    </section>
  `;

  const apiBaseInput = document.getElementById('admin-api-base');
  const apiKeyInput = document.getElementById('admin-api-key');
  const status = document.getElementById('admin-console-status');
  const courseForm = document.getElementById('admin-course-form');
  const liveForm = document.getElementById('admin-live-form');
  const enrollmentForm = document.getElementById('admin-enrollment-form');
  const overviewGrid = document.getElementById('admin-overview-grid');
  const coursesList = document.getElementById('admin-courses-list');
  const liveList = document.getElementById('admin-live-list');
  const studentsList = document.getElementById('admin-students-list');
  const ordersList = document.getElementById('admin-orders-list');
  const liveCourseSelect = document.getElementById('admin-live-course-select');
  const studentSelect = document.getElementById('admin-student-select');
  const enrollmentCourseSelect = document.getElementById('admin-course-select');

  if (!(apiBaseInput instanceof HTMLInputElement) || !(apiKeyInput instanceof HTMLInputElement)) return;
  if (!(courseForm instanceof HTMLFormElement) || !(liveForm instanceof HTMLFormElement) || !(enrollmentForm instanceof HTMLFormElement)) return;
  if (!status || !overviewGrid || !coursesList || !liveList || !studentsList || !ordersList) return;
  if (!(liveCourseSelect instanceof HTMLSelectElement) || !(studentSelect instanceof HTMLSelectElement) || !(enrollmentCourseSelect instanceof HTMLSelectElement)) return;

  apiBaseInput.value = getWebsiteApiBase();
  apiKeyInput.value = getStoredTeacherApiKey();

  apiBaseInput.addEventListener('change', () => {
    window.localStorage.setItem('veteran-api-base', apiBaseInput.value.trim());
    status.textContent = `Saved API base: ${apiBaseInput.value.trim()}`;
  });

  apiKeyInput.addEventListener('change', () => {
    setStoredTeacherApiKey(apiKeyInput.value.trim());
    status.textContent = 'Teacher API key saved locally in this browser.';
  });

  const loadData = async () => {
    try {
      const [overview, courses, liveClasses, students, orders] = await Promise.all([
        loadAdminOverview(),
        loadAdminCourses(),
        loadAdminLiveClasses(),
        loadAdminStudents(),
        loadAdminOrders(),
      ]);

      overviewGrid.innerHTML = [
        { label: 'Students', value: overview.totalStudents },
        { label: 'Courses', value: overview.totalCourses },
        { label: 'Live Now', value: overview.liveNow },
        { label: 'Revenue', value: formatINR(overview.revenue || 0) },
      ]
        .map(
          (item) => `
            <article class="stat-card">
              <strong>${item.value}</strong>
              <span>${item.label}</span>
            </article>
          `,
        )
        .join('');

      const courseOptions = courses
        .map((course) => `<option value="${course.id}">${course.title}</option>`)
        .join('');
      liveCourseSelect.innerHTML = courseOptions;
      enrollmentCourseSelect.innerHTML = courseOptions;
      studentSelect.innerHTML = students
        .map((student) => `<option value="${student.id}">${student.fullName}</option>`)
        .join('');

      coursesList.innerHTML = courses
        .map(
          (course) => `
            <article class="admin-list-card">
              <div class="teacher-test-top">
                <div>
                  <span class="pill">${course.status}</span>
                  <h3>${course.title}</h3>
                  <p class="card-copy">${course.category} | ${course.level}</p>
                </div>
                <div class="teacher-badges">
                  <span class="badge">${formatINR(course.price)}</span>
                  <span class="badge">${course.students} students</span>
                </div>
              </div>
              <p class="teacher-test-summary">${course.description}</p>
              <div class="action-row">
                <button class="button button-secondary admin-course-toggle" type="button" data-course-id="${course.id}" data-next-status="${course.status === 'published' ? 'draft' : 'published'}">
                  ${course.status === 'published' ? 'Move To Draft' : 'Publish'}
                </button>
              </div>
            </article>
          `,
        )
        .join('');

      liveList.innerHTML = liveClasses
        .map(
          (liveClass) => `
            <article class="admin-list-card">
              <div class="teacher-test-top">
                <div>
                  <span class="pill">${liveClass.status}</span>
                  <h3>${liveClass.title}</h3>
                  <p class="card-copy">${liveClass.mentor} | Room ${liveClass.roomCode}</p>
                </div>
                <div class="teacher-badges">
                  <span class="badge">${liveClass.participants.length} participants</span>
                </div>
              </div>
              <p class="teacher-test-summary">${formatDateTime(liveClass.startsAt)} to ${formatDateTime(liveClass.endsAt)}</p>
              <div class="action-row">
                <button class="button button-secondary admin-live-status" type="button" data-live-class-id="${liveClass.id}" data-next-status="live">Set Live</button>
                <button class="button button-secondary admin-live-status" type="button" data-live-class-id="${liveClass.id}" data-next-status="scheduled">Set Scheduled</button>
                <button class="button button-secondary admin-live-status" type="button" data-live-class-id="${liveClass.id}" data-next-status="ended">Set Ended</button>
              </div>
            </article>
          `,
        )
        .join('');

      studentsList.innerHTML = students
        .map(
          (student) => `
            <article class="admin-list-card">
              <div class="teacher-test-top">
                <div>
                  <h3>${student.fullName}</h3>
                  <p class="card-copy">${student.email}</p>
                </div>
                <div class="teacher-badges">
                  <span class="badge">${student.enrollmentCount} courses</span>
                  <span class="badge">${formatINR(student.totalSpent)}</span>
                </div>
              </div>
            </article>
          `,
        )
        .join('');

      ordersList.innerHTML = orders
        .map(
          (order) => `
            <article class="admin-list-card">
              <div class="teacher-test-top">
                <div>
                  <h3>${order.studentName}</h3>
                  <p class="card-copy">${order.courseTitle}</p>
                </div>
                <div class="teacher-badges">
                  <span class="badge">${order.status}</span>
                  <span class="badge">${formatINR(order.amount)}</span>
                </div>
              </div>
              <p class="teacher-test-summary">${formatDateTime(order.createdAt)} | ${order.source}</p>
            </article>
          `,
        )
        .join('');

      document.querySelectorAll('.admin-course-toggle').forEach((button) => {
        button.addEventListener('click', async () => {
          const courseId = button.getAttribute('data-course-id');
          const nextStatus = button.getAttribute('data-next-status');
          if (!courseId || !nextStatus) return;

          try {
            await fetchJson(`${getWebsiteApiBase()}/api/admin/courses/${encodeURIComponent(courseId)}`, {
              method: 'PATCH',
              headers: buildTeacherHeaders(),
              body: JSON.stringify({ status: nextStatus }),
            });
            status.textContent = `Updated course state for ${courseId}.`;
            await loadData();
          } catch (error) {
            status.textContent = `Unable to update course: ${error.message}`;
          }
        });
      });

      document.querySelectorAll('.admin-live-status').forEach((button) => {
        button.addEventListener('click', async () => {
          const liveClassId = button.getAttribute('data-live-class-id');
          const nextStatus = button.getAttribute('data-next-status');
          if (!liveClassId || !nextStatus) return;

          try {
            await fetchJson(`${getWebsiteApiBase()}/api/admin/live-classes/${encodeURIComponent(liveClassId)}`, {
              method: 'PATCH',
              headers: buildTeacherHeaders(),
              body: JSON.stringify({ status: nextStatus }),
            });
            status.textContent = `Updated live-class state for ${liveClassId}.`;
            await loadData();
          } catch (error) {
            status.textContent = `Unable to update live class: ${error.message}`;
          }
        });
      });
    } catch (error) {
      status.textContent = `Unable to load admin data: ${error.message}`;
    }
  };

  courseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(courseForm);
    const payload = {
      title: String(formData.get('title') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      instructor: String(formData.get('instructor') || '').trim(),
      level: String(formData.get('level') || 'Beginner'),
      price: Number(formData.get('price') || 0),
      originalPrice: Number(formData.get('originalPrice') || 0) || undefined,
      totalDurationHours: Number(formData.get('totalDurationHours') || 60),
      thumbnail: String(formData.get('thumbnail') || 'NB').trim(),
      tags: String(formData.get('tags') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      description: String(formData.get('description') || '').trim(),
      featured: formData.get('featured') === 'on',
      couponEnabled: formData.get('couponEnabled') === 'on',
      status: 'published',
    };

    try {
      await fetchJson(`${getWebsiteApiBase()}/api/admin/courses`, {
        method: 'POST',
        headers: buildTeacherHeaders(),
        body: JSON.stringify(payload),
      });
      courseForm.reset();
      status.textContent = 'Course created successfully.';
      await loadData();
    } catch (error) {
      status.textContent = `Unable to create course: ${error.message}`;
    }
  });

  liveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(liveForm);
    const payload = {
      title: String(formData.get('title') || '').trim(),
      mentor: String(formData.get('mentor') || '').trim(),
      courseId: String(formData.get('courseId') || '').trim(),
      startsAt: new Date(String(formData.get('startsAt') || '')).toISOString(),
      endsAt: new Date(String(formData.get('endsAt') || '')).toISOString(),
      status: String(formData.get('status') || 'scheduled'),
      roomCode: String(formData.get('roomCode') || '').trim(),
      isPublic: formData.get('isPublic') === 'on',
    };

    try {
      await fetchJson(`${getWebsiteApiBase()}/api/admin/live-classes`, {
        method: 'POST',
        headers: buildTeacherHeaders(),
        body: JSON.stringify(payload),
      });
      liveForm.reset();
      status.textContent = 'Live class created successfully.';
      await loadData();
    } catch (error) {
      status.textContent = `Unable to create live class: ${error.message}`;
    }
  });

  enrollmentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(enrollmentForm);
    const payload = {
      userId: String(formData.get('userId') || '').trim(),
      courseId: String(formData.get('courseId') || '').trim(),
      notes: String(formData.get('notes') || '').trim(),
    };

    try {
      await fetchJson(`${getWebsiteApiBase()}/api/admin/enrollments`, {
        method: 'POST',
        headers: buildTeacherHeaders(),
        body: JSON.stringify(payload),
      });
      enrollmentForm.reset();
      status.textContent = 'Enrollment created successfully.';
      await loadData();
    } catch (error) {
      status.textContent = `Unable to create enrollment: ${error.message}`;
    }
  });

  await loadData();
}

async function renderTeacherTests() {
  const main = document.getElementById('page-content');
  if (!main) return;

  main.innerHTML = `
    <section class="page-hero">
      <div class="glass-panel">
        <div class="eyebrow">Teacher Test Manager</div>
        <h1>Create full mocks and sectional tests</h1>
        <p>Use this page to create future tests, publish them, and make them live on the website free-test flow.</p>
      </div>
    </section>

    <section class="teacher-grid">
      <article class="info-panel">
        <div class="eyebrow">Connection</div>
        <h3>Backend connection</h3>
        <div class="teacher-form">
          <input id="teacher-api-base" type="text" placeholder="API Base URL" />
          <input id="teacher-api-key" type="text" placeholder="Teacher API Key (if configured)" />
        </div>
        <p class="form-note" id="teacher-connection-note">Point this page to the backend so newly created tests can be saved and published.</p>
      </article>

      <article class="info-panel">
        <div class="eyebrow">Create Test</div>
        <h3>Add a new mock or sectional test</h3>
        <form id="teacher-test-form" class="teacher-form">
          <input name="title" type="text" placeholder="Test Title" required />
          <input name="examTag" type="text" placeholder="Exam Tag" required />
          <input name="description" type="text" placeholder="Description" />
          <input name="createdBy" type="text" placeholder="Created By" value="Yashraj Singh Chauhan" />
          <div class="teacher-mode-grid">
            <select name="mode" required>
              <option value="full">Full Mock</option>
              <option value="sectional">Sectional Test</option>
            </select>
            <input name="durationMinutes" type="number" min="5" step="5" placeholder="Duration Minutes" value="60" />
            <select name="sectionalSection">
              <option value="English">English Section</option>
              <option value="Reasoning">Reasoning Section</option>
              <option value="Quant">Quant Section</option>
              <option value="GA">GA Section</option>
            </select>
          </div>
          <div class="teacher-count-grid">
            <input name="English" type="number" min="0" placeholder="English Questions" value="30" />
            <input name="Reasoning" type="number" min="0" placeholder="Reasoning Questions" value="35" />
            <input name="Quant" type="number" min="0" placeholder="Quant Questions" value="35" />
            <input name="GA" type="number" min="0" placeholder="GA Questions" value="0" />
            <input name="sectionalCount" type="number" min="1" placeholder="Sectional Question Count" value="35" />
          </div>
          <p class="teacher-form-note">For a sectional test, choose the target section above. The builder will automatically create just that section.</p>
          <textarea name="instructions" placeholder="Custom instructions (one line per instruction)"></textarea>
          <label class="teacher-check"><input name="isPublished" type="checkbox" checked /> Publish now</label>
          <label class="teacher-check"><input name="isFree" type="checkbox" checked /> Make test free/public</label>
          <button class="button button-primary enquiry-submit" type="submit">Create Test</button>
        </form>
        <p class="form-note" id="teacher-test-status">Create a test here and it can appear in the website free-test section once published.</p>
      </article>
    </section>

    <section class="section-block">
      <div class="section-head">
        <div>
          <div class="eyebrow">Managed Tests</div>
          <h2 class="section-title">Current backend test inventory</h2>
        </div>
      </div>
      <div class="teacher-tests-list" id="teacher-tests-list"></div>
    </section>
  `;

  const apiBaseInput = document.getElementById('teacher-api-base');
  const apiKeyInput = document.getElementById('teacher-api-key');
  const connectionNote = document.getElementById('teacher-connection-note');
  const form = document.getElementById('teacher-test-form');
  const status = document.getElementById('teacher-test-status');
  const list = document.getElementById('teacher-tests-list');

  if (!(apiBaseInput instanceof HTMLInputElement) || !(apiKeyInput instanceof HTMLInputElement)) return;
  if (!(form instanceof HTMLFormElement) || !status || !list || !connectionNote) return;

  apiBaseInput.value = getWebsiteApiBase();
  apiKeyInput.value = getStoredTeacherApiKey();

  apiBaseInput.addEventListener('change', () => {
    window.localStorage.setItem('veteran-api-base', apiBaseInput.value.trim());
    connectionNote.textContent = `Saved API base: ${apiBaseInput.value.trim()}`;
  });

  apiKeyInput.addEventListener('change', () => {
    setStoredTeacherApiKey(apiKeyInput.value.trim());
    connectionNote.textContent = 'Teacher API key saved locally in this browser.';
  });

  const loadTeacherTests = async () => {
    try {
      const tests = await fetchJson(`${getWebsiteApiBase()}/api/teacher/mock-tests`, {
        headers: buildTeacherHeaders(),
      });

      list.innerHTML = tests
        .map(
          (test) => `
            <article class="teacher-test-card">
              <div class="teacher-test-top">
                <div>
                  <span class="pill">${test.mode === 'sectional' ? 'Sectional' : 'Full Mock'}</span>
                  <h3>${test.title}</h3>
                  <p class="card-copy">${test.examTag}</p>
                </div>
                <div class="teacher-badges">
                  <span class="badge">${test.isPublished ? 'Published' : 'Draft'}</span>
                  <span class="badge">${test.isFree ? 'Free' : 'Paid'}</span>
                </div>
              </div>
              <div class="teacher-test-meta">
                <span>${test.totalQuestions} questions</span>
                <span>${test.durationMinutes} mins</span>
                <span>${(test.sections || []).join(' | ')}</span>
              </div>
              <p class="teacher-test-summary">${test.description || 'Generated mock ready for student use across website and app.'}</p>
              <div class="action-row">
                <button class="button button-secondary teacher-toggle" type="button" data-test-id="${test.id}" data-next-published="${test.isPublished ? 'false' : 'true'}">
                  ${test.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button class="button button-secondary teacher-toggle-free" type="button" data-test-id="${test.id}" data-next-free="${test.isFree ? 'false' : 'true'}">
                  ${test.isFree ? 'Make Paid' : 'Make Free'}
                </button>
                ${test.isPublished && test.isFree ? `<a class="button button-primary" href="${buildMockLaunchPath(test.id)}">Open Test</a>` : ''}
              </div>
            </article>
          `,
        )
        .join('');

      list.querySelectorAll('.teacher-toggle').forEach((button) => {
        button.addEventListener('click', async () => {
          const testId = button.getAttribute('data-test-id');
          const nextPublished = button.getAttribute('data-next-published') === 'true';

          try {
            await fetchJson(`${getWebsiteApiBase()}/api/teacher/mock-tests/${encodeURIComponent(testId)}`, {
              method: 'PATCH',
              headers: buildTeacherHeaders(),
              body: JSON.stringify({ isPublished: nextPublished }),
            });
            status.textContent = `Updated publish state for ${testId}.`;
            await loadTeacherTests();
          } catch (error) {
            status.textContent = `Unable to update test state: ${error.message}`;
          }
        });
      });

      list.querySelectorAll('.teacher-toggle-free').forEach((button) => {
        button.addEventListener('click', async () => {
          const testId = button.getAttribute('data-test-id');
          const nextFree = button.getAttribute('data-next-free') === 'true';

          try {
            await fetchJson(`${getWebsiteApiBase()}/api/teacher/mock-tests/${encodeURIComponent(testId)}`, {
              method: 'PATCH',
              headers: buildTeacherHeaders(),
              body: JSON.stringify({ isFree: nextFree }),
            });
            status.textContent = `Updated access type for ${testId}.`;
            await loadTeacherTests();
          } catch (error) {
            status.textContent = `Unable to update test access: ${error.message}`;
          }
        });
      });
    } catch (error) {
      list.innerHTML = `<article class="info-panel"><h3>Unable to load teacher tests</h3><p class="section-copy">${error.message}</p></article>`;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const mode = String(formData.get('mode') || 'full');
    const customInstructions = String(formData.get('instructions') || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    const sectionCounts =
      mode === 'sectional'
        ? {
            [String(formData.get('sectionalSection') || 'English')]: Number(formData.get('sectionalCount') || 35),
          }
        : {
            English: Number(formData.get('English') || 0),
            Reasoning: Number(formData.get('Reasoning') || 0),
            Quant: Number(formData.get('Quant') || 0),
            GA: Number(formData.get('GA') || 0),
          };
    const payload = {
      title: String(formData.get('title') || '').trim(),
      examTag: String(formData.get('examTag') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      createdBy: String(formData.get('createdBy') || 'Teacher').trim(),
      mode,
      durationMinutes: Number(formData.get('durationMinutes') || 60),
      isPublished: formData.get('isPublished') === 'on',
      isFree: formData.get('isFree') === 'on',
      instructions: customInstructions,
      sectionCounts,
    };

    try {
      await fetchJson(`${getWebsiteApiBase()}/api/teacher/mock-tests`, {
        method: 'POST',
        headers: buildTeacherHeaders(),
        body: JSON.stringify(payload),
      });
      form.reset();
      const createdByField = form.elements.namedItem('createdBy');
      if (createdByField instanceof HTMLInputElement) createdByField.value = 'Yashraj Singh Chauhan';
      status.textContent = 'Test created successfully. It is now available in the backend inventory.';
      await loadTeacherTests();
    } catch (error) {
      status.textContent = `Unable to create test: ${error.message}`;
    }
  });

  await loadTeacherTests();
}

function renderLogin(content) {
  const main = document.getElementById('page-content');
  main.innerHTML = `
    <section class="page-hero">
      <div class="glass-panel">
        <div class="eyebrow">Login</div>
        <h1>Continue to student access</h1>
        <p>Use your student portal to continue learning from the website or the app with the same Veteran account journey.</p>
      </div>
    </section>

    <section class="login-grid">
      <article class="login-card info-panel">
        <div class="eyebrow">Student portal</div>
        <h3>Continue your learning</h3>
        <p class="section-copy">Open the student portal to access purchased content, continue classes, and stay connected to your preparation.</p>
        <div class="action-row">
          <a class="button button-primary" href="${content.branding.loginUrl}" target="_blank" rel="noreferrer">Open student portal</a>
          <a class="button button-secondary" href="${content.branding.appDownloadUrl}" target="_blank" rel="noreferrer">Open app download</a>
        </div>
      </article>

      <article class="login-card info-panel">
        <div class="eyebrow">Access everywhere</div>
        <h3>Learn from website and app</h3>
        <div class="feature-list">
          <div class="feature-item"><span class="feature-dot"></span><div>Use the website for quick browsing and student access.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Use the app for learning on the go.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Stay connected to classes, tests, and course updates.</div></div>
          <div class="feature-item"><span class="feature-dot"></span><div>Continue your preparation with the Veteran learning ecosystem.</div></div>
        </div>
      </article>
    </section>
  `;
}

async function boot() {
  const content = await loadContent();
  renderBrand(content.branding);
  setupThemeToggle();
  renderFooter(content);

  const page = document.body.dataset.page;
  if (page === 'courses') {
    await renderCourses(content);
    return;
  }

  if (page === 'free-tests') {
    await renderFreeTests(content);
    return;
  }

  if (page === 'mock-test') {
    await renderMockTest();
    return;
  }

  if (page === 'admin-console') {
    await renderAdminConsole();
    return;
  }

  if (page === 'teacher-tests') {
    await renderTeacherTests();
    return;
  }

  if (page === 'live-classes') {
    await renderLiveClasses(content);
    return;
  }

  if (page === 'login') {
    renderLogin(content);
    return;
  }

  renderHome(content);
}

boot().catch((error) => {
  const main = document.getElementById('page-content');
  if (main) {
    main.innerHTML = `<section class="page-hero"><div class="glass-panel"><h1>Unable to load content</h1><p>${error.message}</p></div></section>`;
  }
});
