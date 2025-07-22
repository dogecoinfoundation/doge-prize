import { z } from 'zod';

// Schema for server config validation
export const ServerConfigSchema = z.object({
  title: z.string().optional().transform(val => val === '' ? null : val),
  subtitle: z.string().optional().transform(val => val === '' ? null : val),
  prizeHeading: z.string().optional().transform(val => val === '' ? null : val),
  redeemButtonText: z.string().optional().transform(val => val === '' ? null : val),
  footerText: z.string().optional().transform(val => val === '' ? null : val),
  footerTextPosition: z.enum(['above', 'below']).default('below'),
  footerImage: z.string().optional().transform(val => val === '' ? null : val),
  footerUrl: z.string().optional().transform(val => val === '' ? null : val).refine(val => !val || /^https?:\/\/.+/.test(val), {
    message: "Must be a valid URL starting with http:// or https://"
  }),
  backgroundImage: z.string().optional().transform(val => val === '' ? null : val),
  logoImage: z.string().optional().transform(val => val === '' ? null : val),
  showWave: z.boolean().default(false),
  panelAlignment: z.enum(['left', 'center', 'right']).default('left'),
});

export type ServerConfigInput = z.input<typeof ServerConfigSchema>;
export type ServerConfigOutput = z.output<typeof ServerConfigSchema>; 