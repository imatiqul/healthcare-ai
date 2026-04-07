import { forwardRef } from 'react';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';

type VariantMap = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type SizeMap = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: VariantMap;
  size?: SizeMap;
}

const variantMapping: Record<VariantMap, { variant: MuiButtonProps['variant']; color?: MuiButtonProps['color'] }> = {
  default: { variant: 'contained', color: 'primary' },
  destructive: { variant: 'contained', color: 'error' },
  outline: { variant: 'outlined' },
  secondary: { variant: 'contained', color: 'secondary' },
  ghost: { variant: 'text' },
  link: { variant: 'text', color: 'primary' },
};

const sizeMapping: Record<SizeMap, MuiButtonProps['size']> = {
  default: 'medium',
  sm: 'small',
  lg: 'large',
  icon: 'small',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', sx, ...props }, ref) => {
    const mapped = variantMapping[variant];
    return (
      <MuiButton
        ref={ref}
        variant={mapped.variant}
        color={mapped.color}
        size={sizeMapping[size]}
        sx={[
          variant === 'link' && { textDecoration: 'underline', '&:hover': { textDecoration: 'underline' } },
          size === 'icon' && { minWidth: 40, width: 40, height: 40, p: 0 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

