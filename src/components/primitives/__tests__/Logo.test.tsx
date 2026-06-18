import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Logo } from '../Logo'

describe('Logo', () => {
  it('should render the Bauhaus geometric logo', () => {
    const { container } = render(<Logo />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('should render circles, squares, and triangles', () => {
    const { container } = render(<Logo />)
    const circle = container.querySelector('circle')
    const rect = container.querySelector('rect')
    const polygon = container.querySelector('polygon')

    expect(circle).toBeTruthy()
    expect(rect).toBeTruthy()
    expect(polygon).toBeTruthy()
  })

  it('should support size variants', () => {
    const { container: smContainer } = render(<Logo size="sm" />)
    const { container: lgContainer } = render(<Logo size="lg" />)

    const smDiv = smContainer.querySelector('div')
    const lgDiv = lgContainer.querySelector('div')

    expect(smDiv?.className).toContain('w-12')
    expect(lgDiv?.className).toContain('w-32')
  })
})
