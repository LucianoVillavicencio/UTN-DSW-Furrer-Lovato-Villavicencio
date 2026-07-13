
interface SectionTitleProps {
    badge: string,
    title: string,
    subtitle: string
}



const SectionTitle = ({badge, title, subtitle}: SectionTitleProps) => {


  return (
    <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm text-primary ">
            {badge}
        </span>

        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>

        {subtitle && (
            <p className="mt-4 font-body text-text-muted">{subtitle}</p>
        )}
    </div>
  )
}

export default SectionTitle;