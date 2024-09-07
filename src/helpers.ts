export function sanitize(name: string) {
    return name
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll('"', '')
        .replaceAll('/', '_');
}