// src/components/__tests__/LoginForm.test.jsx - Tests for the LoginForm component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../LoginForm';
import { AuthContext } from '../../context/AuthContext';
import '@testing-library/jest-dom';

describe('LoginForm Component', () => {
  it('shows validation errors when submitting with empty fields', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });

    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <LoginForm onToggleForm={jest.fn()} />
      </AuthContext.Provider>
    );

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    // Expect our JS state validation message to be rendered
    await waitFor(() => {
      expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls the login function from context with correct values on valid submit', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });

    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <LoginForm onToggleForm={jest.fn()} />
      </AuthContext.Provider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });
});
