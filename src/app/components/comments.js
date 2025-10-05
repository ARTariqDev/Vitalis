import { useEffect, useRef } from 'react';

const Comments = ({ article }) => {
    const ref = useRef(null);

    useEffect(() => {
        // Dynamically load the Hyvor Talk script
        if (!window.HyvorTalkLoaded) {
            const script = document.createElement('script');
            script.src = 'https://talk.hyvor.com/embed/embed.js';
            script.type = 'module';
            script.async = true;
            document.body.appendChild(script);
            window.HyvorTalkLoaded = true;
        }
    }, []);

    // Use article.id as page-id if available, else fallback to article.url or window.location.href
    const pageId = article?.id || article?.url || (typeof window !== 'undefined' ? window.location.href : '');

    if (!article) {
        return <div>No article data for comments.</div>;
    }

    return (
        <hyvor-talk-comments
            ref={ref}
            website-id="14252"
            page-id={pageId}
        ></hyvor-talk-comments>
    );
};

export default Comments;
