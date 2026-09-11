/** Conventional Commits: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'web',
        'gateway',
        'content',
        'media',
        'chatbot',
        'speech',
        'ui',
        'types',
        'config',
        'infra',
        'ci',
        'deps',
        'repo',
        // Los commits que genera semantic-release al publicar una version.
        'release',
      ],
    ],
    'subject-case': [0],
  },
};
