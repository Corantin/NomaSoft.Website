import {getMDXComponent} from 'next-contentlayer/hooks';

const mdxComponents = {
  h1: (props: any) => <h1 className="text-4xl font-semibold text-white" {...props} />,
  h2: (props: any) => <h2 className="mt-8 text-2xl font-semibold text-white" {...props} />,
  p: (props: any) => <p className="mt-4 text-sm leading-relaxed text-zinc-300" {...props} />,
  ul: (props: any) => <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-zinc-300" {...props} />
};

export function MdxContent({code}: {code: string}) {
  const Component = getMDXComponent(code);
  return <Component components={mdxComponents} />;
}
