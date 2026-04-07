import { forwardRef } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

export type InputProps = Omit<TextFieldProps, 'variant'> & {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ size = 'small', ...props }, ref) => (
    <TextField
      inputRef={ref}
      variant="outlined"
      size={size as any}
      fullWidth
      {...props}
    />
  )
);
Input.displayName = 'Input';
