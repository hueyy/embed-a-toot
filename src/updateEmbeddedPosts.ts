import { Status } from "./MastodonApiV1Entities";
import { TemplateClass } from "./TemplateConstants";
import { fetchStatus } from "./fetchFromMastodonApi";

// Support for the HTML Sanitizer API (not yet supported by Safari/FireFox)
// https://wicg.github.io/sanitizer-api/
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API
declare global {
	class Sanitizer {
	}
	interface SetHTMLOptions {
		sanitizer: Sanitizer
	}
	interface Element {
		setHTML(input: string, options?: SetHTMLOptions): void;
	}
}

interface DataToUpdate {
	counters: boolean;
	content: boolean;
}

const updateEmbeddedPost = (
	postsOutermostElement: Element,
	dataToUpdate: DataToUpdate,
	status: Status,
) => {
	const contentMainElement = postsOutermostElement.querySelector(`main`);
	const counterReblogsElement = postsOutermostElement.querySelector(`.${TemplateClass.counterReblogs}`);
	const counterFavouritesElement = postsOutermostElement.querySelector(`.${TemplateClass.counterFavourites}`);
	const editedDateTimeElement = postsOutermostElement.querySelector(`.${TemplateClass.editTime}`) as HTMLTimeElement;

	if (dataToUpdate.content && contentMainElement && "setHTML" in contentMainElement) {
		contentMainElement.setHTML(status.content);
		if (status.edited_at && editedDateTimeElement) {
			editedDateTimeElement.attributes.removeNamedItem('display');
			const editedAtDate = new Date(status.edited_at);
			editedDateTimeElement.dateTime = editedAtDate.toISOString();
			editedDateTimeElement.textContent = editedAtDate.toLocaleString(undefined, {
				month: "short", day: "numeric", year: "numeric",
				hour: "numeric", minute: "2-digit"
			});
		}
	}
	if (dataToUpdate.counters) {
		if (counterReblogsElement != null) {
			counterReblogsElement.textContent = `${status.reblogs_count}`;
		}
		if (counterFavouritesElement != null) {
			counterFavouritesElement.textContent = `${status.reblogs_count}`;
		}
	}
}


const updateEmbeddedPosts = () => {
	const commentContainerElements = document.querySelectorAll('[data-mastodon-host][data-status-id]');
	for (const postsOutermostElement of commentContainerElements) {
		if (postsOutermostElement instanceof HTMLElement) {

			const {mastodonHost, statusId, update, updateContent, updateCounters} = postsOutermostElement.dataset as {
				mastodonHost: string;
				statusId: string;
				update?: string;
				updateCounters?: string;
				updateContent?: string;
				secondsUntilRefresh?: string; // FIXME TODO
			};
			const dataToUpdate: DataToUpdate = {
				counters: update != null || updateCounters != null,
				content: update != null || updateContent != null,
			};
			if (dataToUpdate.content || dataToUpdate.counters) {
				fetchStatus({host: mastodonHost, status: statusId})
				.then( status => updateEmbeddedPost(postsOutermostElement, dataToUpdate, status ))
			};
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	updateEmbeddedPosts()
})
