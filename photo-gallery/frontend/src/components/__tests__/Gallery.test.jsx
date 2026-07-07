// src/components/__tests__/Gallery.test.jsx - Tests for the Gallery component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Gallery from '../Gallery';
import '@testing-library/jest-dom';

describe('Gallery Component', () => {
  it('shows loading skeletons when loading=true', () => {
    const { container } = render(
      <Gallery
        images={[]}
        loading={true}
        totalPages={1}
        currentPage={1}
        onPageChange={jest.fn()}
        totalImages={0}
      />
    );
    
    // Find divs with the className "skeleton"
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows an error message with a retry button when error is set', () => {
    const onRetryMock = jest.fn();
    render(
      <Gallery
        images={[]}
        loading={false}
        error="Unable to connect to database"
        totalPages={1}
        currentPage={1}
        onPageChange={jest.fn()}
        onRetry={onRetryMock}
        totalImages={0}
      />
    );

    expect(screen.getByText(/Failed to load gallery/i)).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect to database/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalled();
  });

  it('shows an empty state when images array is empty', () => {
    render(
      <Gallery
        images={[]}
        loading={false}
        error={null}
        totalPages={1}
        currentPage={1}
        onPageChange={jest.fn()}
        totalImages={0}
      />
    );

    expect(screen.getByText(/No photos yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload your first image/i)).toBeInTheDocument();
  });
});
