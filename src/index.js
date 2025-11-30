(function (blocks, blockEditor, element, components, data) {
  const { registerBlockType } = blocks;
  const { useBlockProps, InspectorControls } = blockEditor;
  const { createElement: el, Fragment, useState } = element;
  const { PanelBody, TextControl, Button, Spinner } = components;
  const { useSelect } = data;

  const PER_PAGE = 5;

  const Edit = (props) => {
    const { attributes, setAttributes } = props;
    const { postTitle, postUrl } = attributes;

    const [searchTerm, setSearchTerm] = useState("");
    const [searchId, setSearchId] = useState("");
    const [page, setPage] = useState(1);

    const { posts, isResolving } = useSelect(
      (select) => {
        const core = select("core");
        if (!core) {
          return { posts: [], isResolving: false };
        }

        const {
          getEntityRecords,
          getEntityRecord,
          isResolving: isResolvingSelector,
        } = core;

        if (searchId) {
          const idNum = parseInt(searchId, 10);
          if (!idNum) {
            return { posts: [], isResolving: false };
          }

          const post = getEntityRecord("postType", "post", idNum);
          const resolving =
            isResolvingSelector &&
            isResolvingSelector("getEntityRecord", ["postType", "post", idNum]);

          return { posts: post ? [post] : [], isResolving: !!resolving };
        }

        const query = {
          per_page: PER_PAGE,
          page,
          order: "desc",
          orderby: "date",
        };

        if (searchTerm) {
          query.search = searchTerm;
        }

        const result = getEntityRecords("postType", "post", query) || [];

        const resolving =
          isResolvingSelector &&
          isResolvingSelector("getEntityRecords", ["postType", "post", query]);

        return { posts: result, isResolving: !!resolving };
      },
      [searchTerm, searchId, page]
    );

    const blockProps = useBlockProps({ className: "dmg-read-more" });

    const handleSelectPost = (post) => {
      setAttributes({
        postId: post.id,
        postTitle:
          post.title && post.title.rendered ? post.title.rendered : post.title,
        postUrl: post.link,
      });
    };

    const canGoPrev = page > 1 && !searchId;
    const canGoNext = !searchId && posts && posts.length === PER_PAGE;

    const postsList =
      posts && posts.length
        ? posts.map((post) =>
            el(
              "div",
              { key: post.id, style: { marginBottom: "8px" } },
              el(
                "div",
                { style: { fontWeight: "bold" } },
                post.title && post.title.rendered
                  ? post.title.rendered
                  : "(no title)"
              ),
              el(
                "div",
                {
                  style: {
                    fontSize: "12px",
                    opacity: 0.7,
                    marginBottom: "4px",
                  },
                },
                `ID: ${post.id}`
              ),
              el(
                Button,
                {
                  isSecondary: true,
                  onClick: () => handleSelectPost(post),
                },
                "Use this post"
              )
            )
          )
        : el("p", null, "No posts found.");

    return el(
      Fragment,
      null,
      el(
        InspectorControls,
        null,
        el(
          PanelBody,
          { title: "Select a post", initialOpen: true },
          el(TextControl, {
            label: "Search posts",
            value: searchTerm,
            onChange: (value) => {
              setSearchTerm(value);
              setSearchId("");
              setPage(1);
            },
          }),
          el(TextControl, {
            label: "Search by Post ID",
            value: searchId,
            onChange: (value) => {
              setSearchId(value);
              setSearchTerm("");
              setPage(1);
            },
          }),
          !searchId &&
            el(
              "div",
              { style: { margin: "8px 0" } },
              el(
                Button,
                {
                  isSecondary: true,
                  disabled: !canGoPrev,
                  onClick: () => canGoPrev && setPage(page - 1),
                  style: { marginRight: "4px" },
                },
                "Previous"
              ),
              el(
                Button,
                {
                  isSecondary: true,
                  disabled: !canGoNext,
                  onClick: () => canGoNext && setPage(page + 1),
                },
                "Next"
              ),
              el(
                "span",
                {
                  style: {
                    marginLeft: "8px",
                    fontSize: "12px",
                    opacity: 0.7,
                  },
                },
                `Page ${page}`
              )
            ),
          isResolving ? el(Spinner, null) : postsList
        )
      ),
      el(
        "p",
        blockProps,
        postTitle && postUrl
          ? [
              "Read More: ",
              el(
                "a",
                {
                  href: postUrl,
                },
                postTitle
              ),
            ]
          : "Select a post from the sidebar."
      )
    );
  };

  const Save = (props) => {
    const { attributes } = props;
    const { postTitle, postUrl } = attributes;

    if (!postTitle || !postUrl) {
      return null;
    }

    const blockProps = useBlockProps.save({ className: "dmg-read-more" });

    return el(
      "p",
      blockProps,
      "Read More: ",
      el(
        "a",
        {
          href: postUrl,
        },
        postTitle
      )
    );
  };

  registerBlockType("dmg/read-more-link", {
    edit: Edit,
    save: Save,
  });
})(
  window.wp.blocks,
  window.wp.blockEditor,
  window.wp.element,
  window.wp.components,
  window.wp.data
);
