import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

// Mock window.location
delete window.location
window.location = { href: '' }

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
