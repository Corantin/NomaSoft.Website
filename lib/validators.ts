import {z} from 'zod';

export const MAX_MESSAGE_LENGTH = 600;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type Translator = (key: string) => string;

export function createContactSchema(t: Translator) {
  return z
    .object({
      name: z.string().min(2, t('validation.name.min')).max(80, t('validation.name.max')),
      email: z.string().email(t('validation.email')),
      company: z
        .string()
        .max(120, t('validation.company.max'))
        .optional()
        .transform((value) => value?.trim() || undefined),
      message: z
        .string()
        .min(12, t('validation.message.min'))
        .max(MAX_MESSAGE_LENGTH, t('validation.message.max')),
      service: z.string().min(1, t('validation.service')),
      token: z.string().optional(),
      honeypot: z.string().optional(),
      file: z
        .instanceof(File)
        .refine((file) => file.size <= MAX_FILE_SIZE, t('validation.file.size'))
        .optional()
    })
    .superRefine((data, ctx) => {
      if (data.honeypot && data.honeypot.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.bot'),
          path: ['honeypot']
        });
      }
    });
}

export type ContactFormInput = z.infer<ReturnType<typeof createContactSchema>>;

export function parseFormData(formData: FormData, t: Translator): ContactFormInput {
  const schema = createContactSchema(t);
  const file = formData.get('file');
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    company: formData.get('company') || undefined,
    message: formData.get('message'),
    service: formData.get('service'),
    token: formData.get('token') || undefined,
    honeypot: formData.get('company-website') || undefined,
    file: file instanceof File && file.size > 0 ? file : undefined
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  return parsed.data;
}
