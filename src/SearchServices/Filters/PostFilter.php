<?php
namespace Szurubooru\SearchServices\Filters;

class PostFilter extends BasicFilter implements IFilter
{
	const ORDER_FAV_TIME = 'lastFavTime';
	const ORDER_FAV_COUNT = 'favCount';
	const ORDER_TAG_COUNT = 'tagCount';

	const REQUIREMENT_TAG = 'tag';
	const REQUIREMENT_ID = 'id';
	const REQUIREMENT_DATE = 'uploadTime';
	const REQUIREMENT_HASH = 'name';
}