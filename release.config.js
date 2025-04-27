module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer', // Determines version bump
    '@semantic-release/release-notes-generator', // Generates changelog content
    '@semantic-release/changelog', // Writes to CHANGELOG.md
    '@semantic-release/npm', // Publishes to NPM
    '@semantic-release/git', // Commits the version bump + changelog
    '@semantic-release/github', // Optional: creates GitHub releases
  ],
};
