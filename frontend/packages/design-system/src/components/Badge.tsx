import { type HTMLAttributes } from 'react';
import Chip, { type ChipProps } from '@mui/material/Chip';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  variant?: BadgeVariant;
}

const colorMapping: Record<BadgeVariant, ChipProps['color']> = {
  default: 'primary',
  secondary: 'secondary',
  destructive: 'error',
  outline: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'error',
};

export function Badge({ variant = 'default', children, ...props }: BadgeProps) {
  return (
    <Chip
      label={children}
      color={colorMapping[variant]}
      variant={variant === 'outline' ? 'outlined' : 'filled'}
      size="small"
      {...(props as any)}
    />
  );
}
