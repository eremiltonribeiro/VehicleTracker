# Sistema de Gestão de Frota - Granduvale Mineração

## Overview

This is a comprehensive fleet management system designed for Granduvale Mineração, built to track vehicle operations including fuel records, maintenance, trips, and vehicle checklists. The system provides a full-stack solution with offline capabilities and data synchronization.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for development and production builds
- **Offline Support**: IndexedDB with custom service worker for offline functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **File Uploads**: Multer for handling image uploads
- **Authentication**: Session-based authentication (currently disabled for development)
- **API Design**: RESTful API with comprehensive CRUD operations

### Data Storage Solutions
- **Primary Database**: PostgreSQL with the following core tables:
  - `vehicles`: Vehicle registration and details
  - `drivers`: Driver information and licensing
  - `vehicle_registrations`: Core transaction table for fuel, maintenance, and trip records
  - `fuel_stations`, `fuel_types`, `maintenance_types`: Reference data
  - `checklist_templates`, `checklist_items`, `vehicle_checklists`: Checklist system
- **Offline Storage**: IndexedDB for local data persistence and sync queue management
- **File Storage**: Local file system with uploads stored in `dist/public/uploads`

## Key Components

### 1. Vehicle Registration System
- **Purpose**: Central system for recording all vehicle activities
- **Types Supported**: Fuel purchases, maintenance activities, trip logs
- **Features**: Type-specific validation, image attachments, offline support
- **Architecture**: Single table design with conditional fields based on type

### 2. CRUD Management System
- **Vehicles**: Complete vehicle lifecycle management with image support
- **Drivers**: Driver information with license tracking
- **Reference Data**: Fuel stations, fuel types, maintenance categories
- **Real-time Sync**: Event-driven updates across all components

### 3. Dashboard and Analytics
- **Multi-tab Interface**: Summary, cost analysis, vehicle comparison, efficiency metrics
- **Time-based Filtering**: Flexible date range selection
- **Vehicle/Driver Filtering**: Multi-select filtering capabilities
- **Charts**: Cost evolution, consumption trends, performance metrics

### 4. Checklist System
- **Template-based**: Reusable checklist templates
- **Vehicle Inspections**: Pre/post-trip inspections
- **Status Tracking**: OK, Issue, Not Applicable status options
- **Photo Documentation**: Image capture for inspection items

### 5. Offline Functionality
- **Local Storage**: IndexedDB for data persistence
- **Sync Queue**: Automatic synchronization when connectivity returns
- **File Handling**: Local file caching for images
- **Conflict Resolution**: Timestamp-based conflict resolution

## Data Flow

### Online Operations
1. User interactions trigger API calls
2. Data validated using Zod schemas
3. Database operations via Drizzle ORM
4. React Query cache invalidation
5. Real-time UI updates

### Offline Operations
1. Operations queued in IndexedDB
2. Local data cache updated immediately
3. UI reflects optimistic updates
4. Background sync when connectivity returns
5. Conflict resolution and error handling

### File Upload Flow
1. Images selected via file input
2. Client-side validation and preview
3. FormData upload to server
4. Multer processing and storage
5. Database URL reference storage
6. Offline caching for sync operations

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database operations
- **@neondatabase/serverless**: PostgreSQL connection handling
- **zod**: Runtime type validation and schema definition
- **bcryptjs**: Password hashing (for future authentication)
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **recharts**: Chart components for analytics

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **eslint**: Code linting
- **prettier**: Code formatting

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Port Configuration**: 5000 (main), 5001 (fallback)
- **Hot Reload**: Vite HMR enabled
- **Database**: PostgreSQL with environment variable configuration

### Production Build
- **Build Process**: `npm run build` - Vite frontend build + esbuild backend bundle
- **Start Command**: `npm run start`
- **Asset Serving**: Static files served from `dist/public`
- **Environment Variables**: DATABASE_URL, SESSION_SECRET

### Replit Configuration
- **Deployment Target**: Autoscale
- **Module Requirements**: nodejs-20, web, imagemagick
- **Port Mapping**: 5000→80, 5001→3000
- **Workflow**: Parallel execution with health checks

### Database Migrations
- **Tool**: Drizzle Kit
- **Command**: `npm run db:push`
- **Schema Location**: `shared/schema.ts`
- **Migration Storage**: `migrations/` directory

## Changelog
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.