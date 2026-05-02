import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { QuestionsFilters } from '@/components/questions-filters';

function getSelects() {
  return screen.getAllByRole('combobox') as HTMLSelectElement[];
}

describe('<QuestionsFilters />', () => {
  it('renders three selects (type, difficulty, status)', () => {
    render(
      <QuestionsFilters type="" difficulty="" status="" onChange={() => {}} />
    );
    expect(getSelects()).toHaveLength(3);
  });

  it('reflects current value props', () => {
    render(
      <QuestionsFilters
        type="REACT_APP"
        difficulty="HARD"
        status="solved"
        onChange={() => {}}
      />
    );
    const [t, d, s] = getSelects();
    expect(t.value).toBe('REACT_APP');
    expect(d.value).toBe('HARD');
    expect(s.value).toBe('solved');
  });

  it('changing type select fires onChange("type", value)', () => {
    const onChange = vi.fn();
    render(
      <QuestionsFilters type="" difficulty="" status="" onChange={onChange} />
    );
    fireEvent.change(getSelects()[0], { target: { value: 'FUNCTION_JS' } });
    expect(onChange).toHaveBeenCalledWith('type', 'FUNCTION_JS');
  });

  it('changing difficulty select fires onChange("difficulty", value)', () => {
    const onChange = vi.fn();
    render(
      <QuestionsFilters type="" difficulty="" status="" onChange={onChange} />
    );
    fireEvent.change(getSelects()[1], { target: { value: 'MEDIUM' } });
    expect(onChange).toHaveBeenCalledWith('difficulty', 'MEDIUM');
  });

  it('changing status select fires onChange("status", value)', () => {
    const onChange = vi.fn();
    render(
      <QuestionsFilters type="" difficulty="" status="" onChange={onChange} />
    );
    fireEvent.change(getSelects()[2], { target: { value: 'attempted' } });
    expect(onChange).toHaveBeenCalledWith('status', 'attempted');
  });

  it('selecting "All" fires onChange with empty string', () => {
    const onChange = vi.fn();
    render(
      <QuestionsFilters
        type="REACT_APP"
        difficulty=""
        status=""
        onChange={onChange}
      />
    );
    fireEvent.change(getSelects()[0], { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith('type', '');
  });
});
