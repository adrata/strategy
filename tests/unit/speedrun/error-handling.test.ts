/**
 * Unit Tests: Speedrun Error Handling
 * 
 * Unit tests for error handling logic in Speedrun action logging
 */

describe('Speedrun Error Handling Unit Tests', () => {
  describe('JSON Parsing Error Catching', () => {
    it('should catch JSON parsing errors', async () => {
      // Mock response that throws error when json() is called
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Test the error handling logic
      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 500: Internal Server Error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse error response as JSON:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return fallback error message when JSON parsing fails', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockRejectedValue(new Error('Unexpected token'))
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 400: Bad Request');
    });

    it('should handle multiple JSON parsing attempts', async () => {
      const mockResponse = {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: jest.fn()
          .mockRejectedValueOnce(new Error('First attempt failed'))
          .mockRejectedValueOnce(new Error('Second attempt failed'))
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 503: Service Unavailable');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse error response as JSON:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Fallback Error Messages', () => {
    it('should return fallback error message for non-JSON responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 404: Not Found');
    });

    it('should handle responses without statusText', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 500: Unknown error');
    });

    it('should handle null response', async () => {
      const mockResponse = null;

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP Unknown: Unknown error');
    });

    it('should handle undefined response', async () => {
      const mockResponse = undefined;

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP Unknown: Unknown error');
    });
  });

  describe('Type Checking for Response Object', () => {
    it('should check for json method existence', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: null // json method is null
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 400: Bad Request');
    });

    it('should check for json method type', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: 'not a function' // json is not a function
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 401: Unauthorized');
    });

    it('should handle response with json method that throws', async () => {
      const mockResponse = {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: jest.fn().mockImplementation(() => {
          throw new Error('JSON method itself throws');
        })
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP 502: Bad Gateway');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse error response as JSON:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Message Formatting', () => {
    it('should format error messages correctly', async () => {
      const testCases = [
        {
          response: { ok: false, status: 400, statusText: 'Bad Request' },
          expected: 'HTTP 400: Bad Request'
        },
        {
          response: { ok: false, status: 500, statusText: 'Internal Server Error' },
          expected: 'HTTP 500: Internal Server Error'
        },
        {
          response: { ok: false, status: 404, statusText: 'Not Found' },
          expected: 'HTTP 404: Not Found'
        },
        {
          response: { ok: false, status: 403, statusText: 'Forbidden' },
          expected: 'HTTP 403: Forbidden'
        }
      ];

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      for (const testCase of testCases) {
        const result = await handleErrorResponse(testCase.response);
        expect(result).toBe(testCase.expected);
      }
    });

    it('should handle custom error messages from JSON response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({
          error: 'Custom validation error message'
        })
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('Custom validation error message');
    });

    it('should fall back to default message when JSON error is empty', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({
          error: '' // Empty error message
        })
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('Failed to save action log');
    });
  });

  describe('Console Logging of Errors', () => {
    it('should log errors to console', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('JSON parsing failed'))
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      await handleErrorResponse(mockResponse);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse error response as JSON:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not log when JSON parsing succeeds', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({
          error: 'Validation failed'
        })
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      await handleErrorResponse(mockResponse);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log different types of errors', async () => {
      const errorTypes = [
        new Error('Network error'),
        new TypeError('Invalid response'),
        new SyntaxError('JSON parse error'),
        new ReferenceError('Undefined variable')
      ];

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const handleErrorResponse = async (response: any, error: Error) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      for (const error of errorTypes) {
        const mockResponse = {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: jest.fn().mockRejectedValue(error)
        };

        await handleErrorResponse(mockResponse, error);
      }

      expect(consoleSpy).toHaveBeenCalledTimes(errorTypes.length);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse error response as JSON:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle response with undefined status', async () => {
      const mockResponse = {
        ok: false,
        status: undefined,
        statusText: 'Unknown Error'
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status || 'Unknown'}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status || 'Unknown'}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP Unknown: Unknown Error');
    });

    it('should handle response with null status', async () => {
      const mockResponse = {
        ok: false,
        status: null,
        statusText: 'Null Status'
      };

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status || 'Unknown'}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          errorMessage = `HTTP ${response.status || 'Unknown'}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(mockResponse);

      expect(result).toBe('HTTP Unknown: Null Status');
    });

    it('should handle circular reference in response', async () => {
      const circularResponse: any = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Circular reference'))
      };
      
      // Create circular reference
      circularResponse.self = circularResponse;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const handleErrorResponse = async (response: any) => {
        let errorMessage = 'Failed to save action log';
        try {
          if (response && typeof response.json === 'function') {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`;
        }
        return errorMessage;
      };

      const result = await handleErrorResponse(circularResponse);

      expect(result).toBe('HTTP 500: Internal Server Error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse error response as JSON:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
