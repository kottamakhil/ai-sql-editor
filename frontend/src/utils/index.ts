export const classNames = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');
