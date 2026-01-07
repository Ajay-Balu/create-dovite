<script setup lang="ts">
import { ref } from "vue";
import { Button } from "../components/ui/button";

interface DocLink {
  title: string;
  url: string;
  description: string;
  icon: "book" | "package" | "github";
}

const count = ref<number>(0);

const docLinks: DocLink[] = [
  {
    title: "DOMO APIs",
    url: "https://developer.domo.com/portal/8ba9aedad3679-ap-is",
    description: "Explore the API documentation",
    icon: "book",
  },
  {
    title: "Domo Starter Kit",
    url: "https://developer.domo.com/portal/u8w475o2245yp-starter-kits",
    description: "Get started quickly",
    icon: "package",
  },
  {
    title: "GitHub Repository",
    url: "https://github.com/Ajay-Balu/create-dovite",
    description: "View source code",
    icon: "github",
  },
];
</script>

<template>
  <div class="landing-page">
    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Left Side - Hero Section -->
      <div class="hero-section">
        <!-- Logo Container -->
        <div class="logo-container">
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="logo-link"
          >
            <!-- Vite Logo -->
            <svg
              class="logo-icon logo-vite"
              width="64"
              height="64"
              viewBox="0 0 410 404"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M399.641 59.5246L215.643 388.545C211.844 395.338 202.084 395.378 198.228 388.618L10.5817 59.5563C6.38087 52.1896 12.6802 43.2665 21.0281 44.7586L205.223 77.6824C206.398 77.8924 207.601 77.8904 208.776 77.6763L389.119 44.8058C397.439 43.2894 403.768 52.1434 399.641 59.5246Z"
                fill="url(#paint0_linear)"
              />
              <path
                d="M292.965 1.5744L156.801 28.2552C154.563 28.6937 152.906 30.5903 152.771 32.8664L144.395 174.33C144.198 177.662 147.258 180.248 150.51 179.498L188.42 170.749C191.967 169.931 195.172 173.055 194.443 176.622L183.18 231.775C182.422 235.487 185.907 238.661 189.532 237.56L212.947 230.446C216.577 229.344 220.065 232.527 219.297 236.242L201.398 322.875C200.278 328.294 207.486 331.249 210.492 326.603L212.5 323.5L323.454 102.072C325.312 98.3645 322.108 94.137 318.036 94.9228L279.014 102.454C275.347 103.161 272.227 99.746 273.262 96.1583L298.731 7.86689C299.767 4.27314 296.636 0.855181 292.965 1.5744Z"
                fill="url(#paint1_linear)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear"
                  x1="6.00017"
                  y1="32.9999"
                  x2="235"
                  y2="344"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#41D1FF" />
                  <stop offset="1" stop-color="#BD34FE" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear"
                  x1="194.651"
                  y1="8.81818"
                  x2="236.076"
                  y2="292.989"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#FFBD4F" />
                  <stop offset="1" stop-color="#FF980E" />
                </linearGradient>
              </defs>
            </svg>
          </a>
          <span class="plus-sign">+</span>
          <a
            href="https://vuejs.org"
            target="_blank"
            rel="noopener noreferrer"
            class="logo-link"
          >
            <!-- Vue Logo -->
            <svg
              class="logo-icon logo-vue"
              width="64"
              height="64"
              viewBox="0 0 128 128"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#42b883"
                d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110H78.8z"
              />
              <path
                fill="#35495e"
                d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z"
              />
            </svg>
          </a>
          <span class="plus-sign">+</span>
          <a
            href="https://www.domo.com"
            target="_blank"
            rel="noopener noreferrer"
            class="logo-link"
          >
            <!-- Domo Logo -->
            <svg
              class="logo-icon logo-domo"
              width="64"
              height="64"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="16" fill="url(#domoGradient)" />
              <text
                x="50"
                y="65"
                text-anchor="middle"
                fill="white"
                font-size="36"
                font-weight="bold"
                font-family="Arial, sans-serif"
              >
                DOMO
              </text>
              <defs>
                <linearGradient
                  id="domoGradient"
                  x1="0"
                  y1="0"
                  x2="100"
                  y2="100"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#00B5E2" />
                  <stop offset="1" stop-color="#0072BC" />
                </linearGradient>
              </defs>
            </svg>
          </a>
          <span class="plus-sign">+</span>
          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            class="logo-link"
          >
            <!-- Tailwind Logo -->
            <svg
              class="logo-icon logo-tailwind"
              width="64"
              height="64"
              viewBox="0 0 54 33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#tailwindClip)">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z"
                  fill="url(#tailwindGradient)"
                />
              </g>
              <defs>
                <linearGradient
                  id="tailwindGradient"
                  x1="0"
                  y1="16.2"
                  x2="54"
                  y2="16.2"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#06B6D4" />
                  <stop offset="1" stop-color="#22D3EE" />
                </linearGradient>
                <clipPath id="tailwindClip">
                  <rect width="54" height="33" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </a>
          <span class="plus-sign">+</span>
          <a
            href="https://www.shadcn-vue.com"
            target="_blank"
            rel="noopener noreferrer"
            class="logo-link"
          >
            <!-- Shadcn Logo -->
            <svg
              class="logo-icon logo-shadcn"
              width="64"
              height="64"
              viewBox="0 0 256 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="256" height="256" rx="60" fill="currentColor" />
              <line
                x1="208"
                y1="128"
                x2="128"
                y2="208"
                stroke="url(#shadcnGradient)"
                stroke-width="24"
                stroke-linecap="round"
              />
              <line
                x1="192"
                y1="40"
                x2="40"
                y2="192"
                stroke="url(#shadcnGradient)"
                stroke-width="24"
                stroke-linecap="round"
              />
              <defs>
                <linearGradient
                  id="shadcnGradient"
                  x1="40"
                  y1="40"
                  x2="208"
                  y2="208"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stop-color="#fff" />
                  <stop offset="1" stop-color="#a1a1aa" />
                </linearGradient>
              </defs>
            </svg>
          </a>
        </div>

        <!-- Title -->
        <h1 class="title">
          <span class="gradient-text">Dovite</span>
        </h1>
        <p class="subtitle">Vite + Vue + DOMO + Tailwind + Shadcn-Vue</p>
        <p class="description">
          Build beautiful DOMO apps with modern web technologies
        </p>

        <!-- Interactive Demo Section -->
        <div class="demo-section">
          <div class="demo-box">
            <Button @click="count++">Count is {{ count }}</Button>
            <p class="demo-hint">
              Edit
              <code>src/pages/index.vue</code>
              and save to test HMR
            </p>
          </div>
        </div>
      </div>

      <!-- Right Side - Documentation Links -->
      <div class="resources-panel">
        <h2 class="resources-title">Resources</h2>
        <div class="resources-list">
          <a
            v-for="(link, index) in docLinks"
            :key="index"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="resource-link"
          >
            <!-- Book Icon -->
            <svg
              v-if="link.icon === 'book'"
              class="resource-icon"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <!-- Package Icon -->
            <svg
              v-else-if="link.icon === 'package'"
              class="resource-icon"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <!-- GitHub Icon -->
            <svg
              v-else-if="link.icon === 'github'"
              class="resource-icon"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            <div class="resource-info">
              <span class="resource-title">{{ link.title }}</span>
              <span class="resource-description">{{ link.description }}</span>
            </div>
            <!-- External Link Icon -->
            <svg
              class="external-icon"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
        <p class="resources-footer">Click on the logos to learn more</p>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>
        Built with <span style="color: #ef4444">❤</span> using
        <a
          href="https://github.com/Ajay-Balu/create-dovite"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          create-dovite
        </a>
      </p>
    </footer>
  </div>
</template>

<style>
/* Reset and Base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Landing Page */
.landing-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Hero Section */
.hero-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
}

/* Logo Container */
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.logo-link {
  display: inline-flex;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.15);
}

.plus-sign {
  font-size: 1.5rem;
  font-weight: 300;
  color: rgba(113, 113, 122, 0.5);
  margin: 0 0.25rem;
}

/* Logo Icons */
.logo-icon {
  height: 4rem;
  width: 4rem;
  padding: 0.5rem;
  will-change: filter, transform;
  transition: filter 0.3s, transform 0.3s;
}

.logo-vite:hover {
  filter: drop-shadow(0 0 2em rgba(189, 52, 254, 0.667));
}

.logo-vue:hover {
  filter: drop-shadow(0 0 2em rgba(66, 184, 131, 0.667));
}

.logo-domo:hover {
  filter: drop-shadow(0 0 2em rgba(0, 181, 226, 0.667));
}

.logo-tailwind:hover {
  filter: drop-shadow(0 0 2em rgba(6, 182, 212, 0.667));
}

.logo-shadcn {
  color: #27272a;
}

.logo-shadcn:hover {
  filter: drop-shadow(0 0 2em rgba(161, 161, 170, 0.667));
}

/* Title */
.title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.gradient-text {
  background: linear-gradient(
    135deg,
    #bd34fe 0%,
    #41d1ff 25%,
    #0072bc 50%,
    #06b6d4 75%,
    #a1a1aa 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 5s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.subtitle {
  font-size: 1rem;
  color: #a1a1aa;
  font-weight: 500;
}

.description {
  font-size: 0.875rem;
  color: #71717a;
  max-width: 400px;
}

/* Demo Section */
.demo-section {
  margin-top: 1.5rem;
}

.demo-box {
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
}

.demo-hint {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #71717a;
}

.demo-hint code {
  background: rgba(113, 113, 122, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: #a1a1aa;
  font-family: monospace;
  font-size: 0.7em;
}

/* Resources Panel */
.resources-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
}

.resources-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 0.75rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.resource-link:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(6, 182, 212, 0.3);
  transform: translateX(4px);
}

.resource-icon {
  width: 20px;
  height: 20px;
  color: #06b6d4;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.resource-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #f4f4f5;
}

.resource-description {
  font-size: 0.75rem;
  color: #71717a;
}

.external-icon {
  width: 16px;
  height: 16px;
  color: #52525b;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.resource-link:hover .external-icon {
  color: #06b6d4;
  transform: translate(2px, -2px);
}

.resources-footer {
  font-size: 0.75rem;
  color: #52525b;
  text-align: center;
  padding-top: 0.5rem;
}

/* Footer */
.footer {
  padding: 1rem 2rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.footer p {
  font-size: 0.75rem;
  color: #52525b;
}

.footer-link {
  color: #06b6d4;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #a855f7;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    gap: 2rem;
    overflow-y: auto;
  }

  .resources-panel {
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .logo-icon {
    height: 3rem;
    width: 3rem;
  }

  .title {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .logo-icon {
    height: 2.5rem;
    width: 2.5rem;
  }

  .title {
    font-size: 2rem;
  }
}
</style>
