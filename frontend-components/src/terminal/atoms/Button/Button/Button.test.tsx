import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click
      </Button>
    );

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('applies correct variant class', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('primary');
  });

  it('applies correct size class', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('sm');
  });

  it('renders icon in correct position', () => {
    const { rerender } = render(
      <Button icon={<span data-testid="icon">→</span>} iconPosition="left">
        Next
      </Button>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();

    rerender(
      <Button icon={<span data-testid="icon">→</span>} iconPosition="right">
        Next
      </Button>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<Button fullWidth>Wide Button</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('fullWidth');
  });

  it('applies uppercase class by default', () => {
    const { container } = render(<Button>Text</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('uppercase');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
