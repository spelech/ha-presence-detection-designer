import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Presence Detection Designer",
  description:
    "3D Floorplan-Aware Coupled HMM & 2D+Floor Native BLE EKF Presence Engine for Home Assistant",
  base: "/ha-presence-detection-designer/",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: [/^http:\/\/localhost/],

  markdown: {
    math: true,
  },

  themeConfig: {
    search: {
      provider: "local",
    },

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "UI Guide", link: "/ui/floorplan-studio" },
      { text: "How It Works", link: "/how-it-works" },
      { text: "Reference", link: "/reference" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: "/" },
          { text: "Getting Started", link: "/getting-started" },
          { text: "Lighting Automations", link: "/lighting-automations" },
        ],
      },
      {
        text: "Designer UI Guide",
        items: [
          { text: "Floorplan Studio", link: "/ui/floorplan-studio" },
          { text: "Room Editor", link: "/ui/room-editor" },
          { text: "Timeline Playback", link: "/ui/timeline-playback" },
          { text: "Replay & Statistics", link: "/ui/replay-and-statistics" },
          { text: "Global Settings", link: "/ui/global-settings" },
        ],
      },
      {
        text: "Architecture & Reference",
        items: [
          { text: "How It Works", link: "/how-it-works" },
          { text: "Configuration & Reference", link: "/reference" },
          { text: "Architecture & Math", link: "/ARCHITECTURE_AND_MATH" },
          {
            text: "Signal Processing Optimization",
            link: "/SIGNAL_PROCESSING_OPTIMIZATION_REPORT",
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/spelech/ha-presence-detection-designer",
      },
    ],

    editLink: {
      pattern:
        "https://github.com/spelech/ha-presence-detection-designer/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
