import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups, joinGroup } from '../features/groups/groupsSlice';
import GroupTile from './GroupTile';
import './Dashboard.css';

const REFRESH_INTERVAL_MS = 5000;

export default function Dashboard() {
  const dispatch = useDispatch();
  const { list, listStatus, listError, currentStatus, currentError } = useSelector(
    (state) => state.groups
  );
  const { user } = useSelector((state) => state.auth);

  // Other players join and leave in their own tabs, so keep the member
  // counts fresh instead of showing whatever was true at first load.
  useEffect(() => {
    dispatch(fetchGroups());
    const timer = setInterval(() => dispatch(fetchGroups()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [dispatch]);

  const isJoining = currentStatus === 'loading';

  return (
    <div className="dashboard-screen">
      <header className="dashboard-head">
        <h1>Choose your table</h1>
        <p className="dashboard-subtitle">
          {user?.displayName ? `Welcome, ${user.displayName}. ` : ''}
          Tap a group to join it — you'll take the last place in its queue.
        </p>
      </header>

      {listStatus === 'failed' && <p className="dashboard-error">{listError}</p>}
      {currentError && <p className="dashboard-error">{currentError}</p>}
      {listStatus === 'loading' && list.length === 0 && (
        <p className="dashboard-hint">Loading groups…</p>
      )}

      <ul className="group-grid">
        {list.map((group) => (
          <li key={group.id}>
            <GroupTile
              group={group}
              disabled={isJoining}
              onSelect={(groupId) => dispatch(joinGroup(groupId))}
            />
          </li>
        ))}
      </ul>

      {listStatus === 'succeeded' && list.length === 0 && (
        <p className="dashboard-hint">No groups have been set up yet — check back soon.</p>
      )}
    </div>
  );
}
