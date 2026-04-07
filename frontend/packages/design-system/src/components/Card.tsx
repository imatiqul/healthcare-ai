import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import MuiCard, { type CardProps } from '@mui/material/Card';
import MuiCardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, ...props }, ref) => (
    <MuiCard ref={ref} {...props}>{children}</MuiCard>
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <Box ref={ref} sx={{ p: 2.5, pb: 0 }} {...props}>{children}</Box>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ children, ...props }, ref) => (
    <Typography ref={ref} variant="h6" component="h3" fontWeight={600} {...props}>
      {children}
    </Typography>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <MuiCardContent ref={ref} {...props}>{children}</MuiCardContent>
  )
);
CardContent.displayName = 'CardContent';
