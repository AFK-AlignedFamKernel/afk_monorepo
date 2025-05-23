export default function Divider({
    className = ''
}: {
    className?: string
}) {
    return (
        <div className={`divider ${className}`} style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'var(--primary-300)',
            margin: '10px 0'
        }}></div>
    )
}