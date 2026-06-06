const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TaskFlow - Smart Task Management System API',
    version: '1.0.0',
    description: 'Production-grade backend RESTful API for Jira/Trello-like task management. Uses JWT Bearer auth, separates MySQL for relational data and Firestore for logs.',
  },
  servers: [
    {
      url: '/api',
      description: 'Base API path'
    }
  ],
  security: [
    {
      BearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Input your Bearer JWT token in the format: <Token>'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message details.' }
        }
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          errors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Email is already registered.', 'Password must be at least 6 characters.']
          }
        }
      },
      UserRegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@taskflow.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
          role: { type: 'string', enum: ['Admin', 'User'], default: 'User', example: 'User' }
        }
      },
      UserLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john@taskflow.com' },
          password: { type: 'string', format: 'password', example: 'password123' }
        }
      },
      ProjectCreateRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'TaskFlow Dev' },
          description: { type: 'string', example: 'Backend server development project.' }
        }
      },
      TaskCreateRequest: {
        type: 'object',
        required: ['title', 'projectId'],
        properties: {
          title: { type: 'string', example: 'Setup Firebase configuration' },
          description: { type: 'string', example: 'Implement logs using firebase-admin SDK.' },
          projectId: { type: 'integer', example: 1 },
          assignedTo: { type: 'integer', nullable: true, example: 2 }
        }
      },
      TaskStatusUpdateRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['Pending', 'InProgress', 'Done'], example: 'InProgress' }
        }
      },
      TaskAssignRequest: {
        type: 'object',
        required: ['assignedTo'],
        properties: {
          assignedTo: { type: 'integer', nullable: true, example: 2 }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        security: [],
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserRegisterRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'User successfully registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'integer', example: 2 },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@taskflow.com' },
                        role: { type: 'string', example: 'User' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Validation failed / Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in user and obtain JWT token',
        security: [],
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful.' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer', example: 2 },
                            name: { type: 'string', example: 'John Doe' },
                            email: { type: 'string', example: 'john@taskflow.com' },
                            role: { type: 'string', example: 'User' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/projects': {
      post: {
        summary: 'Create a new project',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectCreateRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Project created successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'TaskFlow Dev' },
                        description: { type: 'string', example: 'Backend server development project.' },
                        ownerId: { type: 'integer', example: 1 }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      get: {
        summary: 'Get all authorized projects',
        description: 'Admins receive all projects. Standard Users receive only projects they own.',
        tags: ['Projects'],
        responses: {
          200: {
            description: 'List of projects retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          name: { type: 'string', example: 'TaskFlow Dev' },
                          description: { type: 'string', example: 'Backend server development project.' },
                          owner_id: { type: 'integer', example: 1 },
                          owner_name: { type: 'string', example: 'Admin User' },
                          created_at: { type: 'string', format: 'date-time', example: '2026-06-05T11:43:08Z' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Access token missing or invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/projects/{id}': {
      get: {
        summary: 'Get a project by ID',
        description: 'Retrieves project details. Enforces ownership authorization boundaries.',
        tags: ['Projects'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'The project database ID'
          }
        ],
        responses: {
          200: {
            description: 'Project details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'TaskFlow Dev' },
                        description: { type: 'string', example: 'Backend server development project.' },
                        owner_id: { type: 'integer', example: 1 },
                        owner_name: { type: 'string', example: 'Admin User' },
                        created_at: { type: 'string', format: 'date-time', example: '2026-06-05T11:43:08Z' }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden. You do not own this project.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Project not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/tasks': {
      post: {
        summary: 'Create a task in a project',
        description: 'Only project owners or Admins can create tasks within a project.',
        tags: ['Tasks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskCreateRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task created successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Setup Firebase configuration' },
                        description: { type: 'string', example: 'Implement logs using firebase-admin SDK.' },
                        status: { type: 'string', example: 'Pending' },
                        projectId: { type: 'integer', example: 1 },
                        assignedTo: { type: 'integer', nullable: true, example: 2 }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Access denied. You do not own this project.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Project or Assignee user not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/tasks/{id}/status': {
      patch: {
        summary: 'Update task status',
        description: 'Only the project owner, assigned user, or Admin can update the task status.',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'The task ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskStatusUpdateRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task status updated successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Setup Firebase' },
                        status: { type: 'string', example: 'InProgress' }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden. You are not authorized to update status.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/tasks/{id}/assign': {
      patch: {
        summary: 'Assign/unassign task to a user',
        description: 'Only the project owner or Admin can change task assignment.',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'The task ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskAssignRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Task assignment updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task assignment updated successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        assigned_to: { type: 'integer', nullable: true, example: 2 }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden. You must be the project owner or Admin.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Task or User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/tasks/project/{projectId}': {
      get: {
        summary: 'Get all tasks of a project',
        description: 'Only project owners or Admins can see the tasks list of a project.',
        tags: ['Tasks'],
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'The project ID'
          }
        ],
        responses: {
          200: {
            description: 'Tasks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          title: { type: 'string', example: 'Setup Firebase' },
                          description: { type: 'string', example: 'firebase SDK' },
                          status: { type: 'string', example: 'Pending' },
                          assigned_to: { type: 'integer', example: 2 },
                          assignee_name: { type: 'string', example: 'John Doe' },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden. You do not own this project.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Project not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/reports/user/{userId}': {
      get: {
        summary: 'Get task statistics for a specific user',
        description: 'Users can only view their own stats. Admins can view anyone\'s stats.',
        tags: ['Reports'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'The database user ID'
          }
        ],
        responses: {
          200: {
            description: 'Statistics retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'integer', example: 2 },
                        userName: { type: 'string', example: 'John Doe' },
                        userEmail: { type: 'string', example: 'john@taskflow.com' },
                        statistics: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer', example: 10 },
                            pending: { type: 'integer', example: 4 },
                            inProgress: { type: 'integer', example: 3 },
                            completed: { type: 'integer', example: 3 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden. You can only view your own statistics.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/reports/all': {
      get: {
        summary: 'Get aggregation statistics of all users',
        description: 'Only accessible by Admins.',
        tags: ['Reports'],
        responses: {
          200: {
            description: 'Aggregations retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          userId: { type: 'integer', example: 2 },
                          userName: { type: 'string', example: 'John Doe' },
                          userEmail: { type: 'string', example: 'john@taskflow.com' },
                          total: { type: 'integer', example: 10 },
                          pending: { type: 'integer', example: 4 },
                          inProgress: { type: 'integer', example: 3 },
                          completed: { type: 'integer', example: 3 }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          403: {
            description: 'Forbidden. Admin role required.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  }
};

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Swagger documentation is available at /api-docs');
}

module.exports = {
  setupSwagger
};
