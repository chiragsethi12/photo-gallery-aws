// src/components/__tests__/Upload.test.jsx - Tests for the Upload component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Upload from '../Upload';
import '@testing-library/jest-dom';

describe('Upload Component', () => {
  it('renders the dropzone and details inputs', () => {
    render(<Upload onUploadSuccess={jest.fn()} albums={[]} />);
    
    // Check for dropzone instructions
    expect(screen.getByText(/Drag & drop photos/i)).toBeInTheDocument();
    
    // Check for metadata fields
    expect(screen.getByLabelText(/Add to Album/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
  });

  it('shows an error if a non-image file type is selected', async () => {
    render(<Upload onUploadSuccess={jest.fn()} albums={[]} />);
    
    // Find the hidden dropzone file input
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Create a non-image text file
    const file = new File(['dummy content'], 'document.txt', { type: 'text/plain' });

    // Simulate file drop/selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Assert that error message is rendered
    await waitFor(() => {
      expect(screen.getByText(/File type not allowed/i)).toBeInTheDocument();
      expect(screen.getByText(/document.txt/i)).toBeInTheDocument();
    });
  });
});
