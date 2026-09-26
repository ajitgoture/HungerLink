import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import DonateClothForm from './DonateClothForm';
import { AuthProvider } from '../../context/AuthContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { BrowserRouter } from 'react-router-dom';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key, i18n: { language: 'en' } })
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: '123', name: 'Test' } })
}));

jest.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ showToast: jest.fn() })
}));

test('renders dropdown and simulates change', () => {
  const { container } = render(
    <BrowserRouter>
      <DonateClothForm />
    </BrowserRouter>
  );
  
  // Find recipient category select
  const selects = container.querySelectorAll('select');
  const catSelect = selects[0]; // Recipient category is first
  
  console.log("INITIAL VALUE:", catSelect.value);
  console.log("OPTIONS:", Array.from(catSelect.options).map(o => o.value));
  
  // Simulate change to Men
  fireEvent.change(catSelect, { target: { value: 'Men' } });
  
  console.log("VALUE AFTER CHANGE:", catSelect.value);
  
  const typeSelect = selects[1];
  console.log("TYPE SELECT DISABLED:", typeSelect.disabled);
  console.log("TYPE OPTIONS:", Array.from(typeSelect.options).map(o => o.value));
});
