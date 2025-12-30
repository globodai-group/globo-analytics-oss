module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation
        "style", // Formatting
        "refactor", // Code refactoring
        "perf", // Performance improvement
        "test", // Tests
        "build", // Build system
        "ci", // CI/CD
        "chore", // Maintenance
        "revert", // Revert commit
        "sync", // Sync from other repo
      ],
    ],
    "subject-case": [0], // Disable case check
    "body-max-line-length": [0], // Disable body line length
  },
};
