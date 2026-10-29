import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Modal } from './modal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete?"
        footer={<button onClick={() => setOpen(false)}>Confirm</button>}
      >
        <p>Body</p>
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('opens the native dialog and closes it via the footer button', async () => {
    render(<Harness />);
    const dialog = document.querySelector('dialog')!;
    expect(dialog.open).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(dialog.open).toBe(true);
    expect(screen.getByRole('heading', { name: 'Delete?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(dialog.open).toBe(false);
  });

  it('a click on the overlay itself closes the dialog', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = document.querySelector('dialog')!;
    // target === the dialog element is exactly the overlay case in the click handler
    fireEvent.click(dialog);
    expect(dialog.open).toBe(false);
  });
});
