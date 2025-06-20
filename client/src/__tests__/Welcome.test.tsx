import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Router } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Welcome from '../pages/Welcome'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          {children}
        </Router>
      </QueryClientProvider>
    )
  }
}

describe('Welcome Page', () => {
  it('renders welcome page correctly', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <Welcome />
      </Wrapper>
    )

    expect(screen.getByText(/Sistema de Gestão de Frotas/i)).toBeInTheDocument()
    expect(screen.getByText(/Controle completo de abastecimentos/i)).toBeInTheDocument()
  })

  it('contains essential navigation elements', () => {
    const Wrapper = createWrapper()
    
    render(
      <Wrapper>
        <Welcome />
      </Wrapper>
    )

    const addButton = screen.getByRole('button', { name: /Adicionar Registro/i })
    const dashboardButton = screen.getByRole('button', { name: /Acessar Dashboard/i })
    const reportsButton = screen.getByRole('button', { name: /Gerar Relatórios/i })
    
    expect(addButton).toBeInTheDocument()
    expect(dashboardButton).toBeInTheDocument()
    expect(reportsButton).toBeInTheDocument()
  })
})
