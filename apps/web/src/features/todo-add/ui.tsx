import { useState } from 'react';

import addIcon from '../../assets/images/svg/task_add_24dp.svg';

interface TodoAddProps {
  onAdd: (title: string) => void;
}

/** Форма добавления: пустой заголовок не отправляется, input очищается после добавления */
export function TodoAdd({ onAdd }: TodoAddProps) {
  const [title, setTitle] = useState('');

  function handleSubmit() {
    const trimmed = title.trim();
    if (trimmed === '') return;
    onAdd(trimmed);
    setTitle('');
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <input
        type="text"
        className={
          'min-w-0 flex-1 rounded-[10px] bg-card-strong px-3 py-2 text-xl ' +
          'ring-1 ring-ring-soft placeholder:text-gray-400 focus:ring-white focus:outline-none'
        }
        placeholder="Новая задача"
        autoComplete="off"
        aria-label="Заголовок новой задачи"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button
        type="submit"
        className={
          'flex items-center gap-2 rounded-[10px] bg-card-strong px-3 py-2 text-xl ' +
          'ring-1 ring-accent-soft transition-colors hover:bg-ring-soft disabled:opacity-40'
        }
        disabled={title.trim() === ''}
      >
        <img src={addIcon} alt="" className="size-6" />
        Add Todo
      </button>
    </form>
  );
}
